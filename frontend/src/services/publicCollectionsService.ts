/**
 * services/publicCollectionsService.ts
 * Servicio para obtener colecciones dinámicamente desde la API pública.
 */

import { apiFetch } from '../utils/apiClient';

export interface PublicCollection {
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
  products?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl?: string;
    position: number;
  }[];
}

export interface PublicPromotion {
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
}

export interface ProductDiscount {
  promotionId: string;
  promotionName: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  discountPercentage: number;
  promotionType: string;
  priority: number;
}

export const publicCollectionsService = {
  /**
   * Obtiene colecciones para mostrar en home
   */
  async getHomeCollections(): Promise<PublicCollection[]> {
    return apiFetch('/api/collections');
  },

  /**
   * Obtiene colecciones por posición de display
   */
  async getCollectionsByPosition(position: 'home' | 'category'): Promise<PublicCollection[]> {
    return apiFetch(`/api/collections/position/${position}`);
  },

  /**
   * Obtiene una colección específica por slug
   */
  async getCollectionBySlug(slug: string): Promise<PublicCollection> {
    return apiFetch(`/api/collections/${slug}`);
  },

  /**
   * Obtiene todas las promociones activas
   */
  async getActivePromotions(): Promise<PublicPromotion[]> {
    return apiFetch('/api/promotions/active');
  },

  /**
   * Obtiene descuentos activos (útil para mostrar badges)
   */
  async getActiveDiscounts(): Promise<
    { productId: string; discount: ProductDiscount }[]
  > {
    return apiFetch('/api/promotions/discounts/active');
  },

  /**
   * Obtiene el descuento para un producto específico
   */
  async getProductDiscount(productId: string, price: number, categoryId?: string): Promise<ProductDiscount | null> {
    const params = new URLSearchParams({
      price: String(price),
      ...(categoryId && { categoryId }),
    });
    try {
      const result = await apiFetch(`/api/promotions/product-discount/${productId}?${params}`) as ProductDiscount | null;
      return result;
    } catch (error) {
      return null;
    }
  },
};
