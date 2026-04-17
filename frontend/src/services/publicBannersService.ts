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

// Caché de módulo: evita re-fetches cuando el dato ya fue cargado
let _bannersCache: PublicBanner[] | null = null;
let _bannersInflight: Promise<PublicBanner[]> | null = null;

export const publicBannersService = {
  /**
   * Obtiene todos los banners activos.
   * La primera llamada fetcha desde la API; las siguientes devuelven el caché.
   */
  async getActiveBanners(): Promise<PublicBanner[]> {
    if (_bannersCache) return _bannersCache;
    if (_bannersInflight) return _bannersInflight;
    _bannersInflight = apiFetch<ApiSuccess<PublicBanner[]>>('/api/banners')
      .then((body) => {
        _bannersCache = body.data ?? [];
        _bannersInflight = null;
        return _bannersCache;
      })
      .catch(() => {
        _bannersInflight = null;
        return [];
      });
    return _bannersInflight;
  },

  /** Devuelve el caché actual de forma síncrona (null si aún no se cargó) */
  getCached(): PublicBanner[] | null {
    return _bannersCache;
  },

  /** Fuerza refetch ignorando caché (útil en el admin) */
  invalidateCache() {
    _bannersCache = null;
    _bannersInflight = null;
  },

  /**
   * Obtiene un banner específico por ID (no incluye datos binarios)
   */
  async getBannerById(id: string): Promise<PublicBanner> {
    const body = await apiFetch<ApiSuccess<PublicBanner>>(`/api/banners/${id}`);
    return body.data;
  },
};
