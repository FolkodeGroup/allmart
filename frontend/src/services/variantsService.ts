/**
 * services/variantsService.ts
 * Servicio HTTP para la gestión de variantes de producto.
 * Centraliza todas las llamadas al backend — sin mocks ni localStorage.
 * Endpoints: /api/admin/products/:productId/variants
 */

import { handleResponse } from '../utils/apiErrorHandler';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Variante tal como la devuelve el backend */
export interface ApiVariant {
  id: string;
  productId: string;
  name: string;
  values: string[];
  createdAt: string;
  updatedAt: string;
}

/** Payload para crear una variante */
export interface CreateVariantPayload {
  name: string;
  values: string[];
}

/** Payload para actualizar una variante */
export interface UpdateVariantPayload {
  name?: string;
  values?: string[];
}

/** Envoltorio estándar de respuestas del admin */
interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

/** GET /api/admin/products/:productId/variants */
export async function fetchVariantsByProduct(token: string, productId: string): Promise<ApiVariant[]> {
  const res = await fetch(`/api/admin/products/${productId}/variants`, {
    headers: authHeaders(token),
  });
  const body = await handleResponse<ApiSuccess<ApiVariant[]>>(res);
  return body.data ?? [];
}

/** POST /api/admin/products/:productId/variants */
export async function createVariant(
  token: string,
  productId: string,
  payload: CreateVariantPayload,
): Promise<ApiVariant> {
  const res = await fetch(`/api/admin/products/${productId}/variants`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<ApiSuccess<ApiVariant>>(res);
  return body.data;
}

/** PUT /api/admin/products/:productId/variants/:variantId */
export async function updateVariant(
  token: string,
  productId: string,
  variantId: string,
  payload: UpdateVariantPayload,
): Promise<ApiVariant> {
  const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<ApiSuccess<ApiVariant>>(res);
  return body.data;
}

/** DELETE /api/admin/products/:productId/variants/:variantId */
export async function deleteVariant(
  token: string,
  productId: string,
  variantId: string,
): Promise<void> {
  const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<ApiSuccess<null>>(res);
}
