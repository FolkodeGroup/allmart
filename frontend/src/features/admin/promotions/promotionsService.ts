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
    return apiFetch(`/admin/promotions?${params}`);
  },

  async getById(id: string): Promise<Promotion> {
    return apiFetch(`/admin/promotions/${id}`);
  },

  async create(data: Partial<Promotion>): Promise<Promotion> {
    return apiFetch('/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async update(id: string, data: Partial<Promotion>): Promise<Promotion> {
    return apiFetch(`/admin/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async delete(id: string): Promise<void> {
    return apiFetch(`/admin/promotions/${id}`, { method: 'DELETE' });
  },

  async duplicate(id: string): Promise<Promotion> {
    return apiFetch(`/admin/promotions/${id}/duplicate`, { method: 'POST' });
  },
};
