/**
 * services/productsService.ts
 * Servicio HTTP para la gestión de productos.
 * Centraliza todas las llamadas al backend y reemplaza el uso de mocks y localStorage.
 */

import type { Product, Category } from '../types';

// ─── Tipos que retorna el backend ─────────────────────────────────────────────

/** Producto tal como lo devuelve el backend */
export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  status: string;
  sku?: string;
  stock: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

/** Respuesta paginada del endpoint público de productos */
export interface PaginatedProducts {
  data: ApiProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

/** Parámetros de filtro para el catálogo público */
export interface PublicProductsParams {
  category?: string;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

/** Payload compatible con el backend para crear/actualizar un producto */
export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  status?: string;
  sku?: string;
  stock?: number;
  rating?: number;
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

/** Convierte un ApiProduct del backend al tipo Product del frontend */
export function mapApiProductToProduct(api: ApiProduct, categories: Category[]): Product {
  const category = categories.find((c) => c.id === api.categoryId) ?? {
    id: api.categoryId,
    name: 'Sin categoría',
    slug: '',
  };

  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    description: api.description ?? '',
    shortDescription: api.description ? api.description.slice(0, 120) : '',
    price: api.price,
    originalPrice: api.compareAtPrice,
    discount:
      api.compareAtPrice && api.compareAtPrice > api.price
        ? Math.round(((api.compareAtPrice - api.price) / api.compareAtPrice) * 100)
        : undefined,
    images: [],
    category,
    tags: [],
    rating: api.rating,
    reviewCount: 0,
    inStock: api.stock > 0,
    sku: api.sku ?? '',
    features: [],
  };
}

/** Convierte un AdminProduct del frontend al payload que acepta el backend */
export function mapAdminProductToPayload(product: {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: { id: string };
  sku?: string;
  stock?: number;
  rating?: number;
  status?: string;
}): ProductPayload {
  return {
    name: product.name,
    description: product.description,
    price: product.price,
    compareAtPrice: product.originalPrice,
    categoryId: product.category.id,
    status: product.status ?? 'active',
    sku: product.sku,
    stock: product.stock ?? 0,
    rating: product.rating ?? 0,
  };
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** GET /api/categories — Obtiene todas las categorías del catálogo */
export async function fetchPublicCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  const body = await handleResponse<ApiSuccess<ApiCategory[]>>(res);
  return body.data.map(mapApiCategoryToCategory);
}

/** GET /api/products — Lista paginada de productos activos */
export async function fetchPublicProducts(
  params: PublicProductsParams = {},
): Promise<PaginatedProducts> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.q)        qs.set('q', params.q);
  if (params.sort)     qs.set('sort', params.sort);
  if (params.page)     qs.set('page', String(params.page));
  if (params.limit)    qs.set('limit', String(params.limit));

  const url = `/api/products${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url);
  return handleResponse<PaginatedProducts>(res);
}

/** GET /api/products/:slug — Detalle de un producto por slug */
export async function fetchPublicProductBySlug(slug: string): Promise<ApiProduct> {
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}`);
  return handleResponse<ApiProduct>(res);
}

// ─── API admin (requieren token de autenticación) ─────────────────────────────

/** GET /api/admin/products — Lista todos los productos para administración */
export async function fetchAdminProducts(token: string): Promise<ApiProduct[]> {
  const res = await fetch('/api/admin/products', {
    headers: authHeaders(token),
  });
  const body = await handleResponse<ApiSuccess<ApiProduct[]>>(res);
  return body.data;
}

/** POST /api/admin/products — Crea un nuevo producto */
export async function createAdminProduct(
  payload: ProductPayload,
  token: string,
): Promise<ApiProduct> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<ApiSuccess<ApiProduct>>(res);
  return body.data;
}

/** PUT /api/admin/products/:id — Actualiza un producto existente */
export async function updateAdminProduct(
  id: string,
  payload: Partial<ProductPayload>,
  token: string,
): Promise<ApiProduct> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<ApiSuccess<ApiProduct>>(res);
  return body.data;
}

/** DELETE /api/admin/products/:id — Elimina un producto */
export async function deleteAdminProduct(id: string, token: string): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  await handleResponse<unknown>(res);
}
