/**
 * services/productImagesService.ts
 * Servicio HTTP para la gestión de imágenes de producto.
 * Centraliza todas las llamadas al backend — sin mocks ni localStorage.
 *
 * Endpoints binarios (almacenamiento BYTEA + WebP):
 *   POST   /api/admin/products/:productId/images/upload   → subir archivo
 *   GET    /api/admin/products/:productId/images          → listar metadatos
 *   GET    /api/admin/products/:productId/images/:id     → metadatos individuales
 *   PATCH  /api/admin/products/:productId/images/:id/meta → actualizar altText/position
 *   DELETE /api/admin/products/:productId/images/:id     → eliminar
 *   GET    /api/images/products/:id                       → servir WebP (público)
 *   GET    /api/images/products/:id/thumb                 → servir miniatura WebP (público)
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Imagen tal como la devuelve el backend */
export interface ApiProductImage {
  id: string;
  productId: string;
  /** URL pública para visualizar la imagen completa: /api/images/products/:id */
  url: string;
  /** URL pública de la miniatura: /api/images/products/:id/thumb */
  thumbUrl?: string;
  altText?: string | null;
  position: number;
  width?: number;
  height?: number;
  thumbWidth?: number;
  thumbHeight?: number;
  mimeType?: string;
  originalFilename?: string | null;
  sizeBytes?: number;
  createdAt: string;
  updatedAt: string;
}

/** Payload para crear una imagen por URL (legacy, compatibilidad) */
export interface CreateImagePayload {
  url: string;
  altText?: string;
  position?: number;
}

/** Payload para actualizar metadatos de imagen */
export interface UpdateImagePayload {
  url?: string;
  altText?: string | null;
  position?: number;
}

/** Payload para actualizar solo metadatos (no reemplaza binario) */
export interface UpdateImageMetaPayload {
  altText?: string | null;
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

function authHeadersFormData(token: string): HeadersInit {
  // NO incluir Content-Type — el browser lo fija con el boundary correcto para multipart
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Error HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/products/:productId/images/upload
 * Sube un archivo de imagen. El backend lo convierte a WebP y genera miniatura.
 * @param file  Archivo seleccionado por el usuario
 * @param altText  Texto alternativo opcional
 * @param position Posición opcional en la galería
 */
export async function uploadProductImage(
  token: string,
  productId: string,
  file: File,
  altText?: string,
  position?: number,
): Promise<ApiProductImage> {
  const form = new FormData();
  form.append('image', file);
  if (altText !== undefined) form.append('altText', altText);
  if (position !== undefined) form.append('position', String(position));

  const res = await fetch(`/api/admin/products/${productId}/images/upload`, {
    method: 'POST',
    headers: authHeadersFormData(token),
    body: form,
  });
  const body = await handleResponse<ApiSuccess<ApiProductImage>>(res);
  return body.data;
}

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

/**
 * PATCH /api/admin/products/:productId/images/:id/meta
 * Actualiza altText y/o position sin reemplazar el binario.
 */
export async function updateProductImageMeta(
  token: string,
  productId: string,
  imageId: string,
  payload: UpdateImageMetaPayload,
): Promise<ApiProductImage> {
  const res = await fetch(`/api/admin/products/${productId}/images/${imageId}/meta`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<ApiSuccess<ApiProductImage>>(res);
  return body.data;
}

/** POST /api/admin/products/:productId/images  (legacy — crea imagen por URL) */
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

/** PUT /api/admin/products/:productId/images/:id  (legacy) */
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
