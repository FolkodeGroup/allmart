/**
 * services/productImagesService.ts
 * Servicio HTTP para la gestión de imágenes de producto.
 * Centraliza todas las llamadas al backend — sin mocks ni localStorage.
 * Endpoints: /api/admin/products/:productId/images
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Imagen tal como la devuelve el backend */
export interface ApiProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

/** Payload para crear una imagen */
export interface CreateImagePayload {
  url: string;
  altText?: string;
  position?: number;
}

/** Payload para actualizar una imagen */
export interface UpdateImagePayload {
  url?: string;
  altText?: string;
  position?: number;
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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Error HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/** GET /api/admin/products/:productId/images */
export async function fetchImagesByProduct(
  token: string,
  productId: string,
): Promise<ApiProductImage[]> {
  const res = await fetch(`/api/admin/products/${productId}/images`, {
    headers: authHeaders(token),
  });
  const body = await handleResponse<ApiSuccess<ApiProductImage[]>>(res);
  return body.data ?? [];
}

/** GET /api/admin/products/:productId/images/:id */
export async function fetchImageById(
  token: string,
  productId: string,
  imageId: string,
): Promise<ApiProductImage> {
  const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
    headers: authHeaders(token),
  });
  const body = await handleResponse<ApiSuccess<ApiProductImage>>(res);
  return body.data;
}

/** POST /api/admin/products/:productId/images */
export async function createProductImage(
  token: string,
  productId: string,
  payload: CreateImagePayload,
): Promise<ApiProductImage> {
  const res = await fetch(`/api/admin/products/${productId}/images`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<ApiSuccess<ApiProductImage>>(res);
  return body.data;
}

/** PUT /api/admin/products/:productId/images/:id */
export async function updateProductImage(
  token: string,
  productId: string,
  imageId: string,
  payload: UpdateImagePayload,
): Promise<ApiProductImage> {
  const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<ApiSuccess<ApiProductImage>>(res);
  return body.data;
}

/** DELETE /api/admin/products/:productId/images/:id */
export async function deleteProductImage(
  token: string,
  productId: string,
  imageId: string,
): Promise<void> {
  const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<unknown>(res);
}
