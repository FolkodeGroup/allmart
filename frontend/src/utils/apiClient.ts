/**
 * utils/apiClient.ts
 * Utilidad centralizada para realizar peticiones HTTP incluyendo el token de autenticación.
 */

import { handleResponse } from './apiErrorHandler';

const STORAGE_KEY = 'allmart_admin_token';
const CSRF_TOKEN_KEY = 'allmart_csrf_token';

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
  });

  return handleResponse<T>(res);
}
