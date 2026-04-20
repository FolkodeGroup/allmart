/**
 * Centraliza el manejo de errores para todas las llamadas HTTP del frontend.
 * Loguea el error para debugging y lanza una excepción capturable por los componentes.
 */

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Lee la respuesta HTTP y lanza un ApiError si el status no es OK.
 * Captura y formatea mensajes de error del backend.
 */
export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      // Manejar expiración de token de forma centralizada
      console.warn('[API Error] 401 Unauthorized - Sesión expirada o inválida');
      
      // Notificar si estamos en el cliente y hay localStorage disponible
      if (typeof window !== 'undefined') {
        const STORAGE_KEY = 'allmart_admin_token';
        localStorage.removeItem(STORAGE_KEY);
        // Disparar evento para que AdminAuthContext se entere y limpie el estado
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
    }

    const errorData = await res.json().catch(() => ({})) as { message?: string, errors?: unknown };
    const errorMessage = errorData.message ?? `Error en la solicitud: ${res.status} ${res.statusText}`;
    
    // Loguear error para debugging centralizado
    console.error(`[API Error] ${res.status} ${res.url}:`, errorData);
    
    throw new ApiError(errorMessage, res.status, errorData);
  }

  // Si la respuesta está vacía (status 204 No Content), devolvemos un objeto vacío para evitar errores de parseo
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

/**
 * Función helper para manejar logs de errores genéricos en bloques catch
 */
export function logError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  console.error(`[Context: ${context}] Error:`, error);
  return message;
}
