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

export interface PromotionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: string;
  categoryId: string | null;
}

export interface PromotionProductsResult {
  directProducts: PromotionProduct[];
  categoryProducts: (PromotionProduct & { assignedViaCategory: string })[];
  categories: { id: string; name: string; slug: string }[];
}

export interface PromotionMatrixItem {
  id: string;
  name: string;
  type: string;
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  directProductCount: number;
  categoryCount: number;
  totalAffectedProducts: number;
}

export const promotionsService = {
  async getAll(page = 1, limit = 10, search?: string, isActive?: boolean): Promise<PaginatedPromotions> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('q', search);
    if (isActive !== undefined) params.append('isActive', String(isActive));
    const response = await apiFetch<{ data: PaginatedPromotions }>(`/api/admin/promotions?${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Promotion> {
    const response = await apiFetch<{ data: Promotion }>(`/api/admin/promotions/${id}`);
    return response.data;
  },

  async create(data: Partial<Promotion>): Promise<Promotion> {
    const response = await apiFetch<{ data: Promotion }>('/api/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async update(id: string, data: Partial<Promotion>): Promise<Promotion> {
    const response = await apiFetch<{ data: Promotion }>(`/api/admin/promotions/${id}`, {
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
    const response = await apiFetch<{ data: Promotion }>(`/api/admin/promotions/${id}/duplicate`, { method: 'POST' });
    return response.data;
  },

  async getProducts(id: string): Promise<PromotionProductsResult> {
    const response = await apiFetch<{ data: PromotionProductsResult }>(`/api/admin/promotions/${id}/products`);
    return response.data;
  },

  async assign(
    id: string,
    payload: { mode: 'add' | 'remove' | 'replace'; productIds?: string[]; categoryIds?: string[] }
  ): Promise<void> {
    await apiFetch(`/api/admin/promotions/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async getMatrix(): Promise<PromotionMatrixItem[]> {
    const response = await apiFetch<{ data: PromotionMatrixItem[] }>('/api/admin/promotions/matrix');
    return response.data;
  },
};
