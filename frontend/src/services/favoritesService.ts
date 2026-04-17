/**
 * services/favoritesService.ts
 * Servicio frontend para favoritos de usuario.
 */

import { apiFetch } from '../utils/apiClient';

export interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: unknown;
  rating: number | string;
  reviewCount: number;
  inStock: boolean;
  status: string;
}

export interface FavoriteItem {
  id: string;
  productId: string;
  createdAt: string;
  product: FavoriteProduct;
}

export const favoritesService = {
  /** Obtiene los favoritos del usuario autenticado */
  async getFavorites(): Promise<FavoriteItem[]> {
    const res = await apiFetch<{ data: FavoriteItem[] }>('/api/favorites');
    return res.data;
  },

  /** Toggle favorito (agrega o quita) */
  async toggleFavorite(productId: string): Promise<{ isFavorite: boolean }> {
    return apiFetch<{ isFavorite: boolean }>(`/api/favorites/${productId}`, {
      method: 'POST',
    });
  },

  /** Verifica si un producto es favorito */
  async checkFavorite(productId: string): Promise<{ isFavorite: boolean }> {
    return apiFetch<{ isFavorite: boolean }>(`/api/favorites/${productId}/check`);
  },

  /** Elimina un favorito */
  async removeFavorite(productId: string): Promise<void> {
    await apiFetch<void>(`/api/favorites/${productId}`, {
      method: 'DELETE',
    });
  },
};
