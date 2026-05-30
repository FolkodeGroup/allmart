/**
 * frontend/src/features/admin/outOfStockAlerts/services/outOfStockAlertsService.ts
 * Servicio para obtener alertas de productos sin stock con pedidos pendientes
 */

import { apiFetch } from '../../../../utils/apiClient';

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface OutOfStockOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
}

export interface OutOfStockOrder {
  id: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: string;
  total: string;
  createdAt: string;
  items: OutOfStockOrderItem[];
}

export interface OutOfStockAlert {
  productId: string;
  productName: string;
  productSku: string | null;
  stock: number;
  totalPendingOrders: number;
  totalQuantityOrdered: number;
  orders: OutOfStockOrder[];
}

export interface OutOfStockAlertsResponse {
  data: OutOfStockAlert[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function normalizeOutOfStockAlertsPayload(
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number
): OutOfStockAlertsResponse {
  const raw = payload as Partial<OutOfStockAlertsResponse> | undefined;
  const data = Array.isArray(raw?.data) ? raw.data : [];

  return {
    data,
    total: typeof raw?.total === 'number' ? raw.total : data.length,
    page: typeof raw?.page === 'number' ? raw.page : fallbackPage,
    limit: typeof raw?.limit === 'number' ? raw.limit : fallbackLimit,
    pages: typeof raw?.pages === 'number' ? raw.pages : 1,
  };
}

export async function getOutOfStockAlerts(
  page = 1,
  limit = 20
): Promise<OutOfStockAlertsResponse> {
  const response = await apiFetch<ApiSuccess<OutOfStockAlertsResponse>>(
    `/api/admin/out-of-stock-alerts?page=${page}&limit=${limit}`,
    {
      method: 'GET',
    }
  );

  return normalizeOutOfStockAlertsPayload(response?.data, page, limit);
}

export async function getOutOfStockAlertCount(): Promise<number> {
  const response = await apiFetch<ApiSuccess<{ count: number }>>(
    '/api/admin/out-of-stock-alerts/count',
    {
      method: 'GET',
    }
  );

  return typeof response?.data?.count === 'number' ? response.data.count : 0;
}

export async function getOutOfStockAlertsByProductId(productId: string): Promise<OutOfStockAlert | null> {
  const response = await apiFetch<ApiSuccess<OutOfStockAlert | null>>(
    `/api/admin/out-of-stock-alerts/product/${productId}`,
    {
      method: 'GET',
    }
  );

  return response?.data ?? null;
}
