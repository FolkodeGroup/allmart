/**
 * utils/apiClient.ts
 * Utilidad centralizada para realizar peticiones HTTP incluyendo el token de autenticación.
 */

import { handleResponse } from './apiErrorHandler';

const STORAGE_KEY = 'allmart_admin_token';
const CSRF_TOKEN_KEY = 'allmart_csrf_token';
const DEFAULT_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(method: string, error: unknown, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;
  if (method !== 'GET') return false;

  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof TypeError) {
    return true;
  }

  return false;
}

/**
 * Obtiene el token CSRF almacenado en la sesión (si existe).
 */
export function getCsrfToken(): string | null {
  return localStorage.getItem(CSRF_TOKEN_KEY);
}

/**
 * Persiste el token CSRF obtenido del backend (ej. en el login).
 */
export function setCsrfToken(token: string): void {
  localStorage.setItem(CSRF_TOKEN_KEY, token);
}

/**
 * Obtiene el token actual del localStorage.
 * Centraliza el acceso al token para todos los servicios.
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Genera cabeceras comunes para las peticiones a la API.
 */
export function getAuthHeaders(token?: string | null): HeadersInit {
  const activeToken = token || getStoredToken();
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  // Prevenir CSRF: Añadir token de cabecera si está disponible
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

/**
 * Versión simplificada de fetch que incluye headers de auth y manejo de errores.
 */
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const maxRetries = method === 'GET' ? 1 : 0;
  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
  const headers = {
    ...getAuthHeaders(token),
    ...(options.headers || {}),
  };

  // Si enviamos FormData, eliminamos el Content-Type para que el navegador lo gestione
  if (options.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type'];
  }

      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      return handleResponse<T>(res);
    } catch (error) {
      window.clearTimeout(timeoutId);

      if (shouldRetry(method, error, attempt, maxRetries)) {
        attempt += 1;
        await delay(RETRY_DELAY_MS * attempt);
        continue;
      }

      throw error;
    }
  }
}
