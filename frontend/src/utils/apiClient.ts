/**
 * utils/apiClient.ts
 * Utilidad centralizada para realizar peticiones HTTP incluyendo el token de autenticación.
 */

import { handleResponse } from './apiErrorHandler';

const STORAGE_KEY = 'allmart_admin_token';

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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
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
