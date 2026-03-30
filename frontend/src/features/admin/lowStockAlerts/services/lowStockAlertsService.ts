/**
 * frontend/src/features/admin/lowStockAlerts/services/lowStockAlertsService.ts
 * Servicio para obtener alertas de stock bajo desde la API
 */

import { apiFetch } from '../../../../utils/apiClient';

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

export async function getLowStockAlerts(
  page = 1,
  limit = 20
): Promise<LowStockAlertsResponse> {
  const response = await apiFetch<LowStockAlertsResponse>(
    `/api/admin/low-stock-alerts?page=${page}&limit=${limit}`,
    {
      method: 'GET',
    }
  );

  return response;
}

export async function getLowStockAlertCount(): Promise<number> {
  const response = await apiFetch<{ count: number }>(
    '/api/admin/low-stock-alerts/count',
    {
      method: 'GET',
    }
  );

  return response.count;
}

export async function getLowStockAlertsByProductId(productId: string): Promise<LowStockAlertDTO[]> {
  const response = await apiFetch<LowStockAlertDTO[]>(
    `/api/admin/low-stock-alerts/product/${productId}`,
    {
      method: 'GET',
    }
  );

  return response;
}
