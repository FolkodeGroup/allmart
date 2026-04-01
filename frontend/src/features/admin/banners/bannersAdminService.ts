/**
 * services/bannersAdminService.ts
 * Servicio para gestionar banners desde el panel administrativo
 */

import { apiFetch } from '../../../utils/apiClient';

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AdminBanner {
  id: string;
  title: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  width: number;
  height: number;
  thumbWidth?: number;
  thumbHeight?: number;
  sizeBytes: number;
  originalFilename?: string;
  altText?: string;
  imageUrl: string;     // /api/images/banners/:id
  thumbUrl: string;     // /api/images/banners/:id/thumb
  createdAt: string;
  updatedAt: string;
}

export const bannersAdminService = {
  /**
   * Obtiene todos los banners (activos e inactivos)
   */
  async getAllBanners(): Promise<AdminBanner[]> {
    const body = await apiFetch<ApiSuccess<AdminBanner[]>>('/api/admin/banners');
    return body.data ?? [];
  },

  /**
   * Obtiene un banner específico por ID
   */
  async getBannerById(id: string): Promise<AdminBanner> {
    const body = await apiFetch<ApiSuccess<AdminBanner>>(`/api/admin/banners/${id}`);
    return body.data;
  },

  /**
   * Crea un nuevo banner con imagen
   */
  async createBanner(data: { title: string; description?: string; altText?: string; displayOrder?: number; isActive?: boolean }, imageFile: File): Promise<AdminBanner> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.altText) formData.append('altText', data.altText);
    if (data.displayOrder !== undefined) formData.append('displayOrder', String(data.displayOrder));
    if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));
    formData.append('image', imageFile);

    const body = await apiFetch<ApiSuccess<AdminBanner>>('/api/admin/banners', {
      method: 'POST',
      body: formData,
    });
    return body.data;
  },

  /**
   * Actualiza metadatos de un banner (sin cambiar imagen)
   */
  async updateBanner(id: string, data: Partial<{ title: string; description: string; displayOrder: number; isActive: boolean; altText: string }>): Promise<AdminBanner> {
    const body = await apiFetch<ApiSuccess<AdminBanner>>(`/api/admin/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return body.data;
  },

  /**
   * Actualiza la imagen de un banner existente
   */
  async updateBannerImage(id: string, imageFile: File): Promise<AdminBanner> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const body = await apiFetch<ApiSuccess<AdminBanner>>(`/api/admin/banners/${id}/image`, {
      method: 'PATCH',
      body: formData,
    });
    return body.data;
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
    const body = await apiFetch<ApiSuccess<AdminBanner[]>>('/api/admin/banners/reorder', {
      method: 'POST',
      body: JSON.stringify({ bannerIds }),
    });
    return body.data ?? [];
  },
};
