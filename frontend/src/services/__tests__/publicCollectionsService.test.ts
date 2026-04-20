import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PublicCollection, PublicPromotion, ProductDiscount } from '../publicCollectionsService';
import { publicCollectionsService } from '../publicCollectionsService';
import * as apiClient from '../../utils/apiClient';

// Mock apiFetch
vi.mock('../../utils/apiClient', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = apiClient.apiFetch as ReturnType<typeof vi.fn>;

describe('publicCollectionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiar el caché de módulo entre tests para que cada test trabaje con datos frescos
    publicCollectionsService.invalidateCache();
  });

  describe('getHomeCollections', () => {
    it('should fetch collections for home display', async () => {
      const mockCollections: PublicCollection[] = [
        {
          id: '1',
          name: 'Summer Collection',
          slug: 'summer-collection',
          description: 'Summer sales',
          displayOrder: 1,
          displayPosition: 'home',
          imageUrl: 'https://example.com/image1.jpg',
          isActive: true,
          productCount: 5,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          products: [
            {
              id: 'p1',
              name: 'Product 1',
              slug: 'product-1',
              price: 100,
              imageUrl: 'https://example.com/p1.jpg',
              position: 1,
            },
          ],
        },
      ];

      mockApiFetch.mockResolvedValueOnce(mockCollections);

      const result = await publicCollectionsService.getHomeCollections();

      expect(mockApiFetch).toHaveBeenCalledWith('/api/collections');
      expect(result).toEqual(mockCollections);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Summer Collection');
    });

    it('should return empty array when no collections exist', async () => {
      mockApiFetch.mockResolvedValueOnce([]);

      const result = await publicCollectionsService.getHomeCollections();

      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('API Error'));

      try {
        await publicCollectionsService.getHomeCollections();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('API Error');
      }
    });

    it('should normalize legacy object image urls', async () => {
      mockApiFetch.mockResolvedValueOnce([
        {
          id: 'legacy-1',
          name: 'Legacy Collection',
          slug: 'legacy-collection',
          displayOrder: 1,
          displayPosition: 'home',
          imageUrl: { url: 'https://example.com/banner.jpg' },
          isActive: true,
          productCount: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          products: [
            {
              id: 'p-legacy',
              name: 'Legacy Product',
              slug: 'legacy-product',
              price: 10,
              imageUrl: { url: 'https://example.com/product.jpg' },
              position: 0,
            },
          ],
        },
      ]);

      const result = await publicCollectionsService.getHomeCollections();

      expect(result[0].imageUrl).toBe('https://example.com/banner.jpg');
      expect(result[0].products?.[0].imageUrl).toBe('https://example.com/product.jpg');
    });
  });

  describe('getCollectionsByPosition', () => {
    it('should fetch collections by display position', async () => {
      const mockCollections: PublicCollection[] = [
        {
          id: '1',
          name: 'Home Featured',
          slug: 'home-featured',
          displayOrder: 1,
          displayPosition: 'home',
          isActive: true,
          productCount: 10,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
      ];

      mockApiFetch.mockResolvedValueOnce(mockCollections);

      const result = await publicCollectionsService.getCollectionsByPosition('home');

      expect(mockApiFetch).toHaveBeenCalledWith('/api/collections/position/home');
      expect(result).toEqual(mockCollections);
    });

    it('should support both home and category positions', async () => {
      mockApiFetch.mockResolvedValueOnce([]);

      await publicCollectionsService.getCollectionsByPosition('category');

      expect(mockApiFetch).toHaveBeenCalledWith('/api/collections/position/category');
    });
  });

  describe('getCollectionBySlug', () => {
    it('should fetch a specific collection by slug', async () => {
      const mockCollection: PublicCollection = {
        id: '1',
        name: 'Summer Sale',
        slug: 'summer-sale',
        description: 'Amazing summer deals',
        displayOrder: 1,
        displayPosition: 'home',
        imageUrl: 'https://example.com/summer.jpg',
        isActive: true,
        productCount: 25,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        products: [
          {
            id: 'p1',
            name: 'Shirt',
            slug: 'shirt',
            price: 49.99,
            position: 1,
          },
        ],
      };

      mockApiFetch.mockResolvedValueOnce(mockCollection);

      const result = await publicCollectionsService.getCollectionBySlug('summer-sale');

      expect(mockApiFetch).toHaveBeenCalledWith('/api/collections/summer-sale');
      expect(result.name).toBe('Summer Sale');
      expect(result.products).toHaveLength(1);
    });

    it('should handle not found errors', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Collection not found'));

      try {
        await publicCollectionsService.getCollectionBySlug('non-existent');
      } catch (error) {
        expect((error as Error).message).toBe('Collection not found');
      }
    });
  });

  describe('getActivePromotions', () => {
    it('should fetch all active promotions', async () => {
      const mockPromotions: PublicPromotion[] = [
        {
          id: 'promo1',
          name: '20% Off Summer',
          description: 'Summer discount',
          type: 'percentage',
          value: 20,
          startDate: '2024-06-01T00:00:00Z',
          endDate: '2024-08-31T23:59:59Z',
          minPurchaseAmount: 50,
          isActive: true,
          priority: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
      ];

      mockApiFetch.mockResolvedValueOnce(mockPromotions);

      const result = await publicCollectionsService.getActivePromotions();

      expect(mockApiFetch).toHaveBeenCalledWith('/api/promotions/active');
      expect(result).toEqual(mockPromotions);
      expect(result[0].type).toBe('percentage');
    });

    it('should return empty array when no promotions are active', async () => {
      mockApiFetch.mockResolvedValueOnce([]);

      const result = await publicCollectionsService.getActivePromotions();

      expect(result).toEqual([]);
    });
  });

  describe('getActiveDiscounts', () => {
    it('should fetch active discounts for products', async () => {
      const mockDiscounts = [
        {
          productId: 'p1',
          discount: {
            promotionId: 'promo1',
            promotionName: '20% Off',
            originalPrice: 100,
            discountAmount: 20,
            finalPrice: 80,
            discountPercentage: 20,
            promotionType: 'percentage',
            priority: 1,
          },
        },
      ];

      mockApiFetch.mockResolvedValueOnce(mockDiscounts);

      const result = await publicCollectionsService.getActiveDiscounts();

      expect(mockApiFetch).toHaveBeenCalledWith('/api/promotions/discounts/active');
      expect(result).toHaveLength(1);
      expect(result[0].discount.finalPrice).toBe(80);
    });

    it('should handle no discounts case', async () => {
      mockApiFetch.mockResolvedValueOnce([]);

      const result = await publicCollectionsService.getActiveDiscounts();

      expect(result).toEqual([]);
    });
  });

  describe('getProductDiscount', () => {
    it('should fetch discount for a specific product', async () => {
      const mockDiscount: ProductDiscount = {
        promotionId: 'promo1',
        promotionName: '20% Off Summer',
        originalPrice: 100,
        discountAmount: 20,
        finalPrice: 80,
        discountPercentage: 20,
        promotionType: 'percentage',
        priority: 1,
      };

      mockApiFetch.mockResolvedValueOnce(mockDiscount);

      const result = await publicCollectionsService.getProductDiscount('p1', 100, ['cat1']);

      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/promotions/product-discount/p1?')
      );
      expect(result).toEqual(mockDiscount);
      expect(result?.finalPrice).toBe(80);
    });

    it('should pass price parameter correctly', async () => {
      mockApiFetch.mockResolvedValueOnce(null);

      await publicCollectionsService.getProductDiscount('p1', 250.50);

      const callArgs = mockApiFetch.mock.calls[0][0] as string;
      expect(callArgs).toContain('price=250.5');
    });

    it('should include categoryIds when provided', async () => {
      mockApiFetch.mockResolvedValueOnce(null);

      await publicCollectionsService.getProductDiscount('p1', 100, ['electronics']);

      const callArgs = mockApiFetch.mock.calls[0][0] as string;
      expect(callArgs).toContain('categoryIds=electronics');
    });

    it('should return null when no discount exists', async () => {
      mockApiFetch.mockResolvedValueOnce(null);

      const result = await publicCollectionsService.getProductDiscount('p1', 100);

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully and return null', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await publicCollectionsService.getProductDiscount('p1', 100);

      expect(result).toBeNull();
    });

    it('should work correctly with very high prices', async () => {
      const mockDiscount: ProductDiscount = {
        promotionId: 'promo1',
        promotionName: 'Discount',
        originalPrice: 999999.99,
        discountAmount: 99999.99,
        finalPrice: 900000,
        discountPercentage: 10,
        promotionType: 'percentage',
        priority: 1,
      };

      mockApiFetch.mockResolvedValueOnce(mockDiscount);

      const result = await publicCollectionsService.getProductDiscount('p1', 999999.99);

      expect(result?.finalPrice).toBe(900000);
    });

    it('should calculate correct discount percentage for fixed discounts', async () => {
      const mockDiscount: ProductDiscount = {
        promotionId: 'promo1',
        promotionName: 'Fixed Discount',
        originalPrice: 100,
        discountAmount: 10,
        finalPrice: 90,
        discountPercentage: 10,
        promotionType: 'fixed',
        priority: 1,
      };

      mockApiFetch.mockResolvedValueOnce(mockDiscount);

      const result = await publicCollectionsService.getProductDiscount('p1', 100);

      expect(result?.promotionType).toBe('fixed');
      expect(result?.finalPrice).toBe(90);
    });
  });
});
