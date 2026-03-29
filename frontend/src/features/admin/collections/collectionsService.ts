/**
 * features/admin/collections/collectionsService.ts
 * Servicio HTTP para la gestión de colecciones.
 */

import { apiFetch } from '../../../utils/apiClient';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  displayPosition: 'home' | 'category';
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
  products?: CollectionProduct[];
}

export interface CollectionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  position: number;
}

export interface PaginatedCollections {
  data: Collection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const collectionsService = {
  async getAll(
    page = 1,
    limit = 10,
    search?: string,
    displayPosition?: string,
    isActive?: boolean
  ): Promise<PaginatedCollections> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('q', search);
    if (displayPosition) params.append('displayPosition', displayPosition);
    if (isActive !== undefined) params.append('isActive', String(isActive));
    return apiFetch(`/admin/collections?${params}`);
  },

  async getById(id: string): Promise<Collection> {
    return apiFetch(`/admin/collections/${id}`);
  },

  async create(data: Partial<Collection> & { productIds?: string[] }): Promise<Collection> {
    return apiFetch('/admin/collections', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async update(
    id: string,
    data: Partial<Collection> & { productIds?: string[] }
  ): Promise<Collection> {
    return apiFetch(`/admin/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async delete(id: string): Promise<void> {
    return apiFetch(`/admin/collections/${id}`, { method: 'DELETE' });
  },

  async reorder(id: string, productOrder: string[]): Promise<void> {
    return apiFetch(`/admin/collections/${id}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ productOrder }),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async addProduct(id: string, productId: string): Promise<Collection> {
    return apiFetch(`/admin/collections/${id}/products`, {
      method: 'POST',
      body: JSON.stringify({ productId }),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async removeProduct(id: string, productId: string): Promise<Collection> {
    return apiFetch(`/admin/collections/${id}/products/${productId}`, { method: 'DELETE' });
  },
};
