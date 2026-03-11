/**
 * services/categoriesService.ts
 * Servicio HTTP para la gestión de categorías.
 * Centraliza todas las llamadas al backend y reemplaza el uso de mocks y localStorage.
 */

import type { Category } from '../types';

// ─── Tipos que retorna el backend ─────────────────────────────────────────────

/** Categoría tal como la devuelve el backend */
export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  itemCount: number;
}

/** Envoltorio estándar de respuestas del admin */
interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Payload compatible con el backend para crear/actualizar una categoría */
export interface CategoryPayload {
  name: string;
  description?: string;
  imageUrl?: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/** Cabeceras con autenticación */
function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Lee la respuesta HTTP y lanza un Error si el status no es OK */
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Error HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Mapeos entre tipos API y tipos frontend ──────────────────────────────────

/** Convierte una ApiCategory del backend al tipo Category del frontend */
export function mapApiCategoryToCategory(api: ApiCategory): Category {
  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    description: api.description,
    image: api.imageUrl,
    itemCount: api.itemCount,
  };
}

/** Convierte una Category del frontend al payload que acepta el backend */
export function mapCategoryToPayload(category: Partial<Category>): CategoryPayload {
  return {
    name: category.name ?? '',
    description: category.description,
    imageUrl: category.image,
  };
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** GET /api/categories — Obtiene todas las categorías del catálogo */
export async function fetchPublicCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  const body = await handleResponse<ApiSuccess<ApiCategory[]>>(res);
  return (body.data || []).map(mapApiCategoryToCategory);
}

// ─── API admin (requieren token de autenticación) ─────────────────────────────

/** GET /api/admin/categories — Lista todas las categorías para administración */
export async function fetchAdminCategories(token: string): Promise<Category[]> {
  const res = await fetch('/api/admin/categories', {
    headers: authHeaders(token),
  });
  const body = await handleResponse<ApiSuccess<ApiCategory[]>>(res);
  return (body.data || []).map(mapApiCategoryToCategory);
}

/** POST /api/admin/categories — Crea una nueva categoría */
export async function createAdminCategory(token: string, category: Omit<Category, 'id'>): Promise<Category> {
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(mapCategoryToPayload(category)),
  });
  const body = await handleResponse<ApiSuccess<ApiCategory>>(res);
  return mapApiCategoryToCategory(body.data);
}

/** PATCH /api/admin/categories/:id — Actualiza una categoría existente */
export async function updateAdminCategory(token: string, id: string, category: Partial<Category>): Promise<Category> {
  const res = await fetch(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(mapCategoryToPayload(category)),
  });
  const body = await handleResponse<ApiSuccess<ApiCategory>>(res);
  return mapApiCategoryToCategory(body.data);
}

/** DELETE /api/admin/categories/:id — Elimina una categoría */
export async function deleteAdminCategory(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/admin/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<ApiSuccess<null>>(res);
}

/** POST /api/admin/categories/:id/image/upload — Sube imagen de categoría */
export async function uploadAdminCategoryImage(token: string, id: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`/api/admin/categories/${id}/image/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = await handleResponse<ApiSuccess<{ imageUrl: string }>>(res);
  return body.data.imageUrl;
}
