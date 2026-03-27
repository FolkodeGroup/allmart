/**
 * services/categoriesService.ts
 * Servicio HTTP para la gestión de categorías.
 * Centraliza todas las llamadas al backend y reemplaza el uso de mocks y localStorage.
 */

import type { Category } from '../../../types';
import { apiFetch } from '../../../utils/apiClient';

// ─── Tipos que retorna el backend ─────────────────────────────────────────────

/** Categoría tal como la devuelve el backend */
export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  itemCount: number;
  isVisible: boolean;
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
  isVisible?: boolean;
}

/** Parámetros para búsqueda y paginación en el admin */
export interface AdminCategoriesParams {
  q?: string;
  page?: number;
  limit?: number;
}

/** Respuesta paginada de categorías */
export interface PaginatedCategories {
  data: ApiCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

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
    isVisible: api.isVisible,
  };
}

/** Convierte una Category del frontend al payload que acepta el backend */
export function mapCategoryToPayload(category: Partial<Category>): CategoryPayload {
  return {
    name: category.name ?? '',
    description: category.description,
    imageUrl: category.image,
    isVisible: category.isVisible,
  };
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** GET /api/categories — Obtiene todas las categorías del catálogo */
export async function fetchPublicCategories(): Promise<Category[]> {
  const body = await apiFetch<ApiSuccess<ApiCategory[]>>('/api/categories');
  return (body.data || []).map(mapApiCategoryToCategory);
}

// ─── API admin (requieren token de autenticación) ─────────────────────────────

/** GET /api/admin/categories — Lista todas las categorías para administración con paginación */
export async function fetchAdminCategories(
  token: string,
  params: AdminCategoriesParams = {},
): Promise<PaginatedCategories> {
  const qs = new URLSearchParams();
  if (params.q)     qs.set('q', params.q);
  if (params.page)  qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const url = `/api/admin/categories${qs.toString() ? `?${qs}` : ''}`;
  const body = await apiFetch<ApiSuccess<PaginatedCategories>>(url, {}, token);
  return body.data;
}

/** POST /api/admin/categories — Crea una nueva categoría */
export async function createAdminCategory(token: string, category: Omit<Category, 'id'>): Promise<Category> {
  const body = await apiFetch<ApiSuccess<ApiCategory>>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(mapCategoryToPayload(category)),
  }, token);
  return mapApiCategoryToCategory(body.data);
}

/** PUT /api/admin/categories/:id — Actualiza una categoría existente */
export async function updateAdminCategory(token: string, id: string, category: Partial<Category>): Promise<Category> {
  const body = await apiFetch<ApiSuccess<ApiCategory>>(`/api/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(mapCategoryToPayload(category)),
  }, token);
  return mapApiCategoryToCategory(body.data);
}

/** DELETE /api/admin/categories/:id — Elimina una categoría */
export async function deleteAdminCategory(token: string, id: string): Promise<void> {
  await apiFetch<ApiSuccess<void>>(`/api/admin/categories/${id}`, {
    method: 'DELETE',
  }, token);
}

/** POST /api/admin/categories/:id/image — Sube una imagen para la categoría */
export async function uploadAdminCategoryImage(token: string, id: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const body = await apiFetch<ApiSuccess<{ imageUrl: string }>>(`/api/admin/categories/${id}/image`, {
    method: 'POST',
    body: formData,
  }, token);

  return body.data.imageUrl;
}
