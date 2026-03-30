/**
 * features/admin/promotions/promotionsService.ts
 * Servicio HTTP para la gestión de promociones.
 */

import { apiFetch } from '../../../utils/apiClient';

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  startDate: string;
  endDate: string;
  minPurchaseAmount?: number;
  maxDiscount?: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  rules?: {
    productIds: string[];
    categoryIds: string[];
  };
}

export interface PaginatedPromotions {
  data: Promotion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const promotionsService = {
  async getAll(page = 1, limit = 10, search?: string, isActive?: boolean): Promise<PaginatedPromotions> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('q', search);
    if (isActive !== undefined) params.append('isActive', String(isActive));
    const response = await apiFetch<any>(`/api/admin/promotions?${params}`);
    // El servidor devuelve { success: true, data: { data: [...], pagination: {...} } }
    // Extraemos el contenido de data
    return response.data;
  },

  async getById(id: string): Promise<Promotion> {
    const response = await apiFetch<any>(`/api/admin/promotions/${id}`);
    return response.data;
  },

  async create(data: Partial<Promotion>): Promise<Promotion> {
    const response = await apiFetch<any>('/api/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async update(id: string, data: Partial<Promotion>): Promise<Promotion> {
    const response = await apiFetch<any>(`/api/admin/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiFetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
  },

  async duplicate(id: string): Promise<Promotion> {
    const response = await apiFetch<any>(`/api/admin/promotions/${id}/duplicate`, { method: 'POST' });
    return response.data;
  },
};
