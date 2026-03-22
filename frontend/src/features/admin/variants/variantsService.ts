/**
 * services/variantsService.ts
 * Servicio HTTP para la gestión de variantes de producto.
 * Centraliza todas las llamadas al backend — sin mocks ni localStorage.
 * Endpoints: /api/admin/products/:productId/variants
 */

import { apiFetch } from '../../../utils/apiClient';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Variante tal como la devuelve el backend */
export interface ApiVariant {
  id: string;
  productId: string;
  name: string;
  values: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload para crear una variante */
export interface CreateVariantPayload {
  name: string;
  values: string[];
  isActive?: boolean;
}

/** Payload para actualizar una variante */
export interface UpdateVariantPayload {
  name?: string;
  values?: string[];
  isActive?: boolean;
}

/** Envoltorio estándar de respuestas del admin */
interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

// ─── API ──────────────────────────────────────────────────────────────────────

/** GET /api/admin/products/:productId/variants */
export async function fetchVariantsByProduct(token: string, productId: string): Promise<ApiVariant[]> {
  const body = await apiFetch<ApiSuccess<ApiVariant[]>>(`/api/admin/products/${productId}/variants`, {}, token);
  return body.data ?? [];
}

/** POST /api/admin/products/:productId/variants */
export async function createVariant(
  token: string,
  productId: string,
  payload: CreateVariantPayload,
): Promise<ApiVariant> {
  const body = await apiFetch<ApiSuccess<ApiVariant>>(`/api/admin/products/${productId}/variants`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return body.data;
}

/** PUT /api/admin/products/:productId/variants/:variantId */
export async function updateVariant(
  token: string,
  productId: string,
  variantId: string,
  payload: UpdateVariantPayload,
): Promise<ApiVariant> {
  const body = await apiFetch<ApiSuccess<ApiVariant>>(`/api/admin/products/${productId}/variants/${variantId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
  return body.data;
}

/** DELETE /api/admin/products/:productId/variants/:variantId */
export async function deleteVariant(
  token: string,
  productId: string,
  variantId: string,
): Promise<void> {
  await apiFetch<ApiSuccess<null>>(`/api/admin/products/${productId}/variants/${variantId}`, {
    method: 'DELETE',
  }, token);
}
