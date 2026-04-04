/**
 * services/publicCollectionsService.ts
 * Servicio para obtener colecciones dinámicamente desde la API pública.
 */

import { apiFetch } from '../utils/apiClient';
import { normalizeImageUrl } from '../utils/imageUrl';
import type { ImageUrlCandidate } from '../utils/imageUrl';

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

type PublicCollectionProduct = NonNullable<PublicCollection['products']>[number];

interface RawPublicCollectionProduct extends Omit<PublicCollectionProduct, 'imageUrl'> {
  imageUrl?: ImageUrlCandidate;
}

interface RawPublicCollection extends Omit<PublicCollection, 'imageUrl' | 'products'> {
  imageUrl?: ImageUrlCandidate;
  products?: RawPublicCollectionProduct[];
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

function isValidProductDiscount(value: unknown): value is ProductDiscount {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const discount = value as Partial<ProductDiscount>;

  return (
    typeof discount.promotionId === 'string' &&
    typeof discount.promotionName === 'string' &&
    Number.isFinite(discount.originalPrice) &&
    Number.isFinite(discount.discountAmount) &&
    Number.isFinite(discount.finalPrice) &&
    Number.isFinite(discount.discountPercentage) &&
    typeof discount.promotionType === 'string' &&
    Number.isFinite(discount.priority)
  );
}

function normalizeCollection(collection: RawPublicCollection): PublicCollection {
  return {
    ...collection,
    imageUrl: normalizeImageUrl(collection.imageUrl),
    products: Array.isArray(collection.products)
      ? collection.products.map((product) => ({
          ...product,
          imageUrl: normalizeImageUrl(product.imageUrl),
        }))
      : undefined,
  };
}

export const publicCollectionsService = {
  /**
   * Obtiene colecciones para mostrar en home
   */
  async getHomeCollections(): Promise<PublicCollection[]> {
    const collections = await apiFetch<RawPublicCollection[]>('/api/collections');
    return collections.map(normalizeCollection);
  },

  /**
   * Obtiene colecciones por posición de display
   */
  async getCollectionsByPosition(position: 'home' | 'category'): Promise<PublicCollection[]> {
    const collections = await apiFetch<RawPublicCollection[]>(`/api/collections/position/${position}`);
    return collections.map(normalizeCollection);
  },

  /**
   * Obtiene una colección específica por slug
   */
  async getCollectionBySlug(slug: string): Promise<PublicCollection> {
    const collection = await apiFetch<RawPublicCollection>(`/api/collections/${slug}`);
    return normalizeCollection(collection);
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
  async getProductDiscount(productId: string, price: number, categoryIds: string[] = []): Promise<ProductDiscount | null> {
    const params = new URLSearchParams({
      price: String(price),
    });
    if (categoryIds.length > 0) {
      params.set('categoryIds', categoryIds.join(','));
    }
    try {
      const result = await apiFetch(`/api/promotions/product-discount/${productId}?${params}`) as unknown;
      return isValidProductDiscount(result) ? result : null;
    } catch (error) {
      return null;
    }
  },
};
