/**
 * services/publicBannersService.ts
 * Servicio para obtener banners dinámicamente desde la API pública.
 */

import { apiFetch } from '../utils/apiClient';

export interface PublicBanner {
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

export const publicBannersService = {
  /**
   * Obtiene todos los banners activos
   */
  async getActiveBanners(): Promise<PublicBanner[]> {
    return apiFetch('/api/banners');
  },

  /**
   * Obtiene un banner específico por ID
   */
  async getBannerById(id: string): Promise<PublicBanner> {
    return apiFetch(`/api/banners/${id}`);
  },
};
