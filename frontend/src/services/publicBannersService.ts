/**
 * services/publicBannersService.ts
 * Servicio para obtener banners dinámicamente desde la API pública.
 */

import { apiFetch } from '../utils/apiClient';

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PublicBanner {
  id: string;
  title: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  imageUrl: string;      // /api/images/banners/:id
  thumbUrl: string;      // /api/images/banners/:id/thumb
  altText?: string;
  createdAt: string;
  updatedAt: string;
}

export const publicBannersService = {
  /**
   * Obtiene todos los banners activos
   */
  async getActiveBanners(): Promise<PublicBanner[]> {
    const body = await apiFetch<ApiSuccess<PublicBanner[]>>('/api/banners');
    return body.data ?? [];
  },

  /**
   * Obtiene un banner específico por ID (no incluye datos binarios)
   */
  async getBannerById(id: string): Promise<PublicBanner> {
    const body = await apiFetch<ApiSuccess<PublicBanner>>(`/api/banners/${id}`);
    return body.data;
  },
};
