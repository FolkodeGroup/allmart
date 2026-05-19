/**
 * services/productsService.ts
 * Servicio HTTP para la gestión de productos.
 * Centraliza todas las llamadas al backend y reemplaza el uso de mocks y localStorage.
 */

import type { Product, Category } from '../../../types';
import { apiFetch, getAuthHeaders } from '../../../utils/apiClient';

// ─── Tipos que retorna el backend ─────────────────────────────────────────────

/** Producto tal como lo devuelve el backend */
export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  images: Array<string | { url?: string } | null>;
  categoryId: string;
  categoryIds?: string[];
  tags: string[];
  status: string;
  sku?: string;
  stock: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isFeatured?: boolean;
  features: string[];
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
  parentId?: string | null;
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
  isFeatured?: boolean;
}

/** Payload compatible con el backend para crear/actualizar un producto */
export interface ProductPayload {
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  images?: string[];
  categoryId: string;
  categoryIds?: string[];
  status?: string;
  sku?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  features?: string[];
}

/** Parámetros de filtro para el catálogo público */
export interface PublicProductsParams {
  category?: string;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

/** Parámetros de filtro para administración */
export type StockLevelFilter = 'all' | 'no_stock' | 'low_stock' | 'in_stock';
export type StatusFilter = 'all' | 'active' | 'inactive';

export interface AdminProductsParams {
  q?: string;
  categoryId?: string;
  status?: StatusFilter;
  stockLevel?: StockLevelFilter;
  page?: number;
  limit?: number;
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
    parentId: api.parentId ?? null,
    itemCount: api.itemCount,
    isVisible: true,
  };
}

/** Convierte un ApiProduct del backend al tipo Product del frontend */
export function mapApiProductToProduct(api: ApiProduct, categories: Category[]): Product {
  const categoryIds = Array.isArray(api.categoryIds)
    ? api.categoryIds
    : api.categoryId
      ? [api.categoryId]
      : [];
  const resolvedCategories = categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((value): value is Category => Boolean(value));
  const fallbackCategory: Category = {
    id: api.categoryId || (categoryIds[0] ?? ''),
    name: 'Sin categoría',
    slug: '',
    isVisible: true,
  };
  const primaryCategory =
    categories.find((c) => c.id === api.categoryId) ??
    resolvedCategories[0] ??
    fallbackCategory;

  const normalizedImages = Array.isArray(api.images)
    ? api.images
        .map((img) => {
          if (typeof img === 'string') return img;
          if (img && typeof img === 'object' && typeof img.url === 'string') return img.url;
          return '';
        })
        .filter(Boolean)
    : [];

  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    description: api.description ?? '',
    shortDescription: api.shortDescription ?? '',
    price: api.price,
    images: normalizedImages,
    category: primaryCategory,
    categoryId: primaryCategory.id || api.categoryId,
    categoryIds: categoryIds.length > 0 ? categoryIds : (primaryCategory.id ? [primaryCategory.id] : []),
    categories: resolvedCategories,
    tags: Array.isArray(api.tags) ? api.tags : [],
    rating: api.rating,
    reviewCount: api.reviewCount ?? 0,
    inStock: api.inStock ?? api.stock > 0,
    isFeatured: api.isFeatured ?? false,
    sku: api.sku ?? '',
    features: Array.isArray(api.features) ? api.features : [],
  };
}

/** Tipo intermedio para el mapeo de producto admin a payload */
interface AdminProductInput {
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  images?: string[];
  category?: { id: string };
  categoryId?: string;
  categoryIds?: string[];
  status?: string;
  sku?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  features?: string[];
  slug?: string;
  variants?: { id?: string; _id?: string; sku?: string; name?: string; values?: string[] }[];
}

/** Convierte un AdminProduct del frontend al payload que acepta el backend */
export function mapAdminProductToPayload(product: AdminProductInput): ProductPayload {
  const primaryCategoryId = product.category?.id ?? product.categoryId ?? '';
  const normalizedCategoryIds = Array.isArray(product.categoryIds)
    ? product.categoryIds
    : primaryCategoryId
      ? [primaryCategoryId]
      : [];

  return {
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    images: product.images,
    categoryId: primaryCategoryId,
    categoryIds: normalizedCategoryIds,
    status: product.status ?? (product.inStock ? 'active' : 'inactive'),
    sku: product.sku,
    stock: product.stock ?? 0,
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    inStock: product.inStock ?? true,
    isFeatured: product.isFeatured ?? false,
    tags: product.tags,
    features: product.features,
  };
}

// ─── API pública ──────────────────────────────────────────────────────────────
/**
 * Construye el payload para duplicar un producto.
 * - name: agrega " (Copia)"
 * - slug: vacío (deja que el backend lo genere)
 * - status: "inactive"
 * - mantiene imágenes, variantes, etc.
 */
export function getDuplicateProductPayload(product: AdminProductInput): ProductPayload {
  // Helper para limpiar id/_id
  const cleanIds = (obj: Record<string, unknown>) => {
    const { id: _id, _id: _rid, ...rest } = obj;
    return rest;
  };

  // SKU temporal único
  const tempSku = (sku: string | undefined | null) => {
    if (!sku || sku === '') return `COPY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return `${sku}-COPY`;
  };

  // Limpiar variantes
  let cleanedVariants: AdminProductInput['variants'] = undefined;
  if (Array.isArray(product.variants)) {
    cleanedVariants = product.variants.map((variant) => {
      const { id: _id, _id: _rid, ...rest } = variant;
      return {
        ...rest,
        sku: tempSku(rest.sku),
      };
    });
  }

  // Limpiar producto principal
  const cleanedProduct = cleanIds({ ...product });

  // Construir el payload
  const payload = mapAdminProductToPayload({
    ...cleanedProduct,
    name: `${product.name} (Copia)`,
    sku: tempSku(product.sku),
    slug: '', // dejar vacío para que el backend genere uno nuevo
    variants: cleanedVariants,
  } as AdminProductInput);

  // Asegurar campos requeridos y mantener los datos solicitados
  return {
    ...payload,
    name: `${product.name} (Copia)`,
    sku: tempSku(product.sku),
    // slug: '',
    status: 'inactive',
    // price, categoryId/categoryIds, images, description, collections se mantienen por mapAdminProductToPayload
  };
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
  if (typeof params.isFeatured !== 'undefined') qs.set('isFeatured', String(params.isFeatured));

  const url = `/api/products${qs.toString() ? `?${qs}` : ''}`;
  return apiFetch<PaginatedProducts>(url);
}

/** GET /api/products/:slug — Detalle de un producto por slug */
export async function fetchPublicProductBySlug(slug: string): Promise<ApiProduct> {
  return apiFetch<ApiProduct>(`/api/products/${encodeURIComponent(slug)}`);
}

// ─── API admin (requieren token de autenticación) ─────────────────────────────

/** GET /api/admin/products — Lista todos los productos para administración con paginación */
export async function fetchAdminProducts(
  token: string,
  params: AdminProductsParams = {},
): Promise<PaginatedProducts> {
  const qs = new URLSearchParams();
  if (params.q)          qs.set('q', params.q);
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.stockLevel && params.stockLevel !== 'all') qs.set('stockLevel', params.stockLevel);
  if (params.page)       qs.set('page', String(params.page));
  if (params.limit)      qs.set('limit', String(params.limit));

  const url = `/api/admin/products${qs.toString() ? `?${qs}` : ''}`;
  const body = await apiFetch<ApiSuccess<PaginatedProducts>>(url, {}, token);
  return body.data;
}

/** POST /api/admin/products — Crea un nuevo producto */
export async function createAdminProduct(
  payload: ProductPayload,
  token: string,
): Promise<ApiProduct> {
  const body = await apiFetch<ApiSuccess<ApiProduct>>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
  return body.data;
}

/** PUT /api/admin/products/:id — Actualiza un producto existente */
export async function updateAdminProduct(
  id: string,
  payload: Partial<ProductPayload>,
  token: string,
): Promise<ApiProduct> {
  const body = await apiFetch<ApiSuccess<ApiProduct>>(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
  return body.data;
}

/** DELETE /api/admin/products/:id — Elimina un producto */
export async function deleteAdminProduct(id: string, token: string): Promise<void> {
  await apiFetch<unknown>(`/api/admin/products/${id}`, {
    method: 'DELETE',
  }, token);
}

/** GET /api/admin/products/low-stock-count — Cantidad total de productos con stock < 5 */
export async function fetchAdminLowStockCount(token: string): Promise<number> {
  const body = await apiFetch<ApiSuccess<{ count: number }>>('/api/admin/products/low-stock-count', {}, token);
  return body.data.count;
}

// ─── Exportación de catálogo PDF ──────────────────────────────────────────────

/** Parámetros para la exportación del catálogo en PDF */
export interface CatalogPdfExportParams {
  /** Título del catálogo (aparece en el header del PDF) */
  title?: string;
  /** Número de columnas en la grilla de productos */
  columns?: 1 | 2 | 3 | 4;
  /** Formato de papel */
  paperFormat?: 'A4' | 'Letter' | 'Legal';
  /** Filtros a aplicar en el servidor */
  filters?: {
    status?: StatusFilter;
    q?: string;
    categoryId?: string;
    stockLevel?: StockLevelFilter;
    /** Límite máximo de productos a incluir (default: 60) */
    limit?: number;
  };
}

/**
 * POST /api/admin/products/export-pdf
 * Genera y descarga el catálogo de productos en PDF.
 * La respuesta es un Blob binario (application/pdf).
 */
export async function exportCatalogPdf(
  params: CatalogPdfExportParams,
  token: string,
): Promise<{ blob: Blob; filename: string }> {
  const headers = {
    ...(getAuthHeaders(token) as Record<string, string>),
    'Content-Type': 'application/json',
  };

  const body: Record<string, unknown> = {
    title: params.title ?? 'Catálogo Allmart',
    columns: params.columns ?? 3,
    paperFormat: params.paperFormat ?? 'A4',
    filters: {
      ...(params.filters?.status && params.filters.status !== 'all' ? { status: params.filters.status } : {}),
      ...(params.filters?.q ? { q: params.filters.q } : {}),
      ...(params.filters?.categoryId ? { categoryId: params.filters.categoryId } : {}),
      ...(params.filters?.stockLevel && params.filters.stockLevel !== 'all' ? { stockLevel: params.filters.stockLevel } : {}),
      ...(params.filters?.limit ? { limit: params.filters.limit } : {}),
    },
  };

  const response = await fetch('/api/admin/products/export-pdf', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => String(response.status));
    throw new Error(`Error al generar el PDF (${response.status}): ${errText}`);
  }

  const blob = await response.blob();

  // Extraer nombre de archivo del header Content-Disposition si está disponible
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filenameMatch = disposition.match(/filename[^;=\n]*=(?:["']?)([^"'\n;]+)/);
  const filename = filenameMatch?.[1]?.trim()
    ?? `catalogo-allmart-${new Date().toISOString().slice(0, 10)}.pdf`;

  return { blob, filename };
}
