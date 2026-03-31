/**
 * services/bannersAdminService.ts
 * Servicio para gestionar banners desde el panel administrativo
 */

import { apiFetch } from '../../../utils/apiClient';

export interface AdminBanner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const bannersAdminService = {
  /**
   * Obtiene todos los banners (activos e inactivos)
   */
  async getAllBanners(): Promise<AdminBanner[]> {
    return apiFetch('/api/admin/banners');
  },

  /**
   * Obtiene un banner específico por ID
   */
  async getBannerById(id: string): Promise<AdminBanner> {
    return apiFetch(`/api/admin/banners/${id}`);
  },

  /**
   * Crea un nuevo banner
   */
  async createBanner(data: Omit<AdminBanner, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminBanner> {
    return apiFetch('/api/admin/banners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualiza un banner existente
   */
  async updateBanner(id: string, data: Partial<Omit<AdminBanner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AdminBanner> {
    return apiFetch(`/api/admin/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Elimina un banner
   */
  async deleteBanner(id: string): Promise<void> {
    return apiFetch(`/api/admin/banners/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reordena banners según su displayOrder
   */
  async reorderBanners(bannerIds: string[]): Promise<AdminBanner[]> {
    return apiFetch('/api/admin/banners/reorder', {
      method: 'POST',
      body: JSON.stringify({ bannerIds }),
    });
  },
};
