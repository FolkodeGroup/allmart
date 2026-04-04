/**
 * frontend/src/features/admin/lowStockAlerts/services/lowStockAlertsService.ts
 * Servicio para obtener alertas de stock bajo desde la API
 */

import { apiFetch } from '../../../../utils/apiClient';

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LowStockAlertDTO {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantitySold: number;
  stockBefore: number;
  stockAfter: number;
  createdAt: string;
  order: {
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
  };
}

export interface LowStockAlertsResponse {
  data: LowStockAlertDTO[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function normalizeLowStockAlertsPayload(
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number
): LowStockAlertsResponse {
  const raw = payload as Partial<LowStockAlertsResponse> | undefined;
  const data = Array.isArray(raw?.data) ? raw.data : [];

  return {
    data,
    total: typeof raw?.total === 'number' ? raw.total : data.length,
    page: typeof raw?.page === 'number' ? raw.page : fallbackPage,
    limit: typeof raw?.limit === 'number' ? raw.limit : fallbackLimit,
    pages: typeof raw?.pages === 'number' ? raw.pages : 1,
  };
}

export type StockAlertLevel = 'no_stock' | 'low_stock';

export interface CurrentLowStockProductDTO {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  inStock: boolean;
  status: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  alertLevel: StockAlertLevel;
}

export interface CurrentLowStockProductsResponse {
  data: CurrentLowStockProductDTO[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  summary: {
    noStock: number;
    lowStock: number;
    threshold: number;
  };
}

export async function getLowStockAlerts(
  page = 1,
  limit = 20
): Promise<LowStockAlertsResponse> {
  const response = await apiFetch<ApiSuccess<LowStockAlertsResponse>>(
    `/api/admin/low-stock-alerts?page=${page}&limit=${limit}`,
    {
      method: 'GET',
    }
  );

  return normalizeLowStockAlertsPayload(response?.data, page, limit);
}

export async function getLowStockAlertCount(): Promise<number> {
  const response = await apiFetch<ApiSuccess<{ count: number }>>(
    '/api/admin/low-stock-alerts/count',
    {
      method: 'GET',
    }
  );

  return typeof response?.data?.count === 'number' ? response.data.count : 0;
}

export async function getLowStockAlertsByProductId(productId: string): Promise<LowStockAlertDTO[]> {
  const response = await apiFetch<ApiSuccess<LowStockAlertDTO[]>>(
    `/api/admin/low-stock-alerts/product/${productId}`,
    {
      method: 'GET',
    }
  );

  return Array.isArray(response?.data) ? response.data : [];
}

function normalizeCurrentLowStockPayload(
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number,
  fallbackThreshold: number,
): CurrentLowStockProductsResponse {
  const raw = payload as Partial<CurrentLowStockProductsResponse> | undefined;
  const data = Array.isArray(raw?.data) ? raw.data : [];
  const total = typeof raw?.total === 'number' ? raw.total : data.length;
  const limit = typeof raw?.limit === 'number' ? raw.limit : fallbackLimit;
  const computedNoStock = data.filter((product) => product.stock <= 0).length;
  const computedLowStock = data.filter((product) => product.stock > 0 && product.stock <= fallbackThreshold).length;

  return {
    data,
    total,
    page: typeof raw?.page === 'number' ? raw.page : fallbackPage,
    limit,
    pages: typeof raw?.pages === 'number' ? raw.pages : Math.max(1, Math.ceil(total / limit)),
    summary: {
      noStock: typeof raw?.summary?.noStock === 'number' ? raw.summary.noStock : computedNoStock,
      lowStock: typeof raw?.summary?.lowStock === 'number' ? raw.summary.lowStock : computedLowStock,
      threshold: typeof raw?.summary?.threshold === 'number' ? raw.summary.threshold : fallbackThreshold,
    },
  };
}

export async function getCurrentLowStockProducts(
  page = 1,
  limit = 20,
  threshold = 5,
): Promise<CurrentLowStockProductsResponse> {
  const response = await apiFetch<ApiSuccess<CurrentLowStockProductsResponse>>(
    `/api/admin/low-stock-alerts/current-products?page=${page}&limit=${limit}&threshold=${threshold}`,
    {
      method: 'GET',
    }
  );

  return normalizeCurrentLowStockPayload(response?.data, page, limit, threshold);
}
