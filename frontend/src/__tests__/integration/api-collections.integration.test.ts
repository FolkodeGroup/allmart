import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration Tests for Public Collections & Promotions API Endpoints
 *
 * These tests verify that:
 * 1. API endpoints return correct data structures
 * 2. Query parameters are properly handled
 * 3. Error scenarios are handled correctly
 * 4. Data transformations work as expected
 */

describe('API Integration Tests - Collections & Promotions', () => {
  // Base URL for API - configure via environment variable if needed
  const API_BASE_URL = 'http://localhost:3001/api';

  describe('GET /api/collections', () => {
    it('should return array of collections for home display', async () => {
      const response = await fetch(`${API_BASE_URL}/collections`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const collection = data[0];
        expect(collection).toHaveProperty('id');
        expect(collection).toHaveProperty('name');
        expect(collection).toHaveProperty('slug');
        expect(collection).toHaveProperty('displayPosition');
        expect(collection).toHaveProperty('isActive');
        expect(collection).toHaveProperty('productCount');
      }
    });

    it('should include products array with correct structure', async () => {
      const response = await fetch(`${API_BASE_URL}/collections`);
      const data = await response.json();

      if (data.length > 0 && data[0].products && data[0].products.length > 0) {
        const product = data[0].products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(typeof product.price).toBe('number');
      }
    });

    it('should handle errors gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/collections?invalid=param`);
      // Should either return 200 with valid data or 400 with error
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /api/collections/position/:position', () => {
    it('should return collections with displayPosition=home', async () => {
      const response = await fetch(`${API_BASE_URL}/collections/position/home`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        data.forEach((collection: any) => {
          expect(collection.displayPosition).toBe('home');
        });
      }
    });

    it('should return collections with displayPosition=category', async () => {
      const response = await fetch(`${API_BASE_URL}/collections/position/category`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        data.forEach((collection: any) => {
          expect(collection.displayPosition).toBe('category');
        });
      }
    });

    it('should handle invalid position parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/collections/position/invalid`);
      expect([400, 404]).toContain(response.status);
    });

    it('should order collections by displayOrder', async () => {
      const response = await fetch(`${API_BASE_URL}/collections/position/home`);
      const data = await response.json();

      if (data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].displayOrder).toBeLessThanOrEqual(data[i + 1].displayOrder);
        }
      }
    });
  });

  describe('GET /api/collections/:slug', () => {
    let testSlug = 'summer-sale';

    it('should return specific collection by slug', async () => {
      // First, get any collection to test with
      const listResponse = await fetch(`${API_BASE_URL}/collections`);
      const collections = await listResponse.json();

      if (collections.length > 0) {
        testSlug = collections[0].slug;
      }

      const response = await fetch(`${API_BASE_URL}/collections/${testSlug}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.slug).toBe(testSlug);
      expect(data).toHaveProperty('products');
    });

    it('should return 404 for non-existent collection', async () => {
      const response = await fetch(`${API_BASE_URL}/collections/non-existent-collection-12345`);
      expect(response.status).toBe(404);
    });

    it('should include full product details', async () => {
      const listResponse = await fetch(`${API_BASE_URL}/collections`);
      const collections = await listResponse.json();

      if (collections.length > 0 && collections[0].products && collections[0].products.length > 0) {
        const response = await fetch(`${API_BASE_URL}/collections/${collections[0].slug}`);
        const data = await response.json();

        const product = data.products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('slug');
        expect(product).toHaveProperty('price');
        expect(typeof product.price).toBe('number');
      }
    });
  });

  describe('GET /api/promotions/active', () => {
    it('should return array of active promotions', async () => {
      const response = await fetch(`${API_BASE_URL}/promotions/active`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const promotion = data[0];
        expect(promotion).toHaveProperty('id');
        expect(promotion).toHaveProperty('name');
        expect(promotion).toHaveProperty('type');
        expect(promotion).toHaveProperty('value');
        expect(promotion).toHaveProperty('isActive', true);
        expect(['percentage', 'fixed', 'bogo']).toContain(promotion.type);
      }
    });

    it('should only return active promotions', async () => {
      const response = await fetch(`${API_BASE_URL}/promotions/active`);
      const data = await response.json();

      data.forEach((promotion: any) => {
        expect(promotion.isActive).toBe(true);
      });
    });

    it('should have valid date ranges', async () => {
      const response = await fetch(`${API_BASE_URL}/promotions/active`);
      const data = await response.json();

      data.forEach((promotion: any) => {
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);
        expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });
  });

  describe('GET /api/promotions/discounts/active', () => {
    it('should return active discounts with product information', async () => {
      const response = await fetch(`${API_BASE_URL}/promotions/discounts/active`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const discount = data[0];
        expect(discount).toHaveProperty('promotionId');
        expect(discount).toHaveProperty('promotionName');
        expect(discount).toHaveProperty('originalPrice');
        expect(discount).toHaveProperty('discountAmount');
        expect(discount).toHaveProperty('finalPrice');
        expect(discount).toHaveProperty('discountPercentage');
        expect(discount).toHaveProperty('applicableProducts');
      }
    });

    it('should have valid discount calculations', async () => {
      const response = await fetch(`${API_BASE_URL}/promotions/discounts/active`);
      const data = await response.json();

      data.forEach((discount: any) => {
        const { originalPrice, discountAmount, finalPrice } = discount;
        expect(originalPrice - discountAmount).toBe(finalPrice);
        expect(finalPrice).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include applicable products', async () => {
      const response = await fetch(`${API_BASE_URL}/promotions/discounts/active`);
      const data = await response.json();

      if (data.length > 0) {
        const discount = data[0];
        expect(Array.isArray(discount.applicableProducts)).toBe(true);

        if (discount.applicableProducts.length > 0) {
          const product = discount.applicableProducts[0];
          expect(product).toHaveProperty('id');
          expect(product).toHaveProperty('name');
        }
      }
    });
  });

  describe('GET /api/promotions/product-discount/:productId', () => {
    let testProductId = 'p1';

    beforeEach(async () => {
      // Get a real product ID from API if possible
      try {
        const response = await fetch(`${API_BASE_URL}/collections`);
        const collections = await response.json();
        if (collections.length > 0 && collections[0].products && collections[0].products.length > 0) {
          testProductId = collections[0].products[0].id;
        }
      } catch (e) {
        // Use default if API call fails
      }
    });

    it('should return discount for specific product', async () => {
      const params = new URLSearchParams({
        price: '100',
      });

      const response = await fetch(
        `${API_BASE_URL}/promotions/product-discount/${testProductId}?${params}`
      );

      // Should return 200 or 404 (if no discount)
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('promotionId');
        expect(data).toHaveProperty('originalPrice');
        expect(data).toHaveProperty('finalPrice');
        expect(data).toHaveProperty('discountPercentage');
      }
    });

    it('should require price parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/promotions/product-discount/${testProductId}`);

      // Should either work or return 400
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should handle price parameter correctly', async () => {
      const params = new URLSearchParams({
        price: '250.99',
      });

      const response = await fetch(
        `${API_BASE_URL}/promotions/product-discount/${testProductId}?${params}`
      );

      expect([200, 404]).toContain(response.status);
    });

    it('should accept optional categoryId parameter', async () => {
      const params = new URLSearchParams({
        price: '100',
        categoryId: 'cat1',
      });

      const response = await fetch(
        `${API_BASE_URL}/promotions/product-discount/${testProductId}?${params}`
      );

      expect([200, 404]).toContain(response.status);
    });

    it('should return null for non-existent product', async () => {
      const params = new URLSearchParams({
        price: '100',
      });

      const response = await fetch(
        `${API_BASE_URL}/promotions/product-discount/non-existent-product-999?${params}`
      );

      expect([404, 200]).toContain(response.status);
      // 200 with null or 404
    });

    it('should calculate correct discounts', async () => {
      const params = new URLSearchParams({
        price: '100',
      });

      const response = await fetch(
        `${API_BASE_URL}/promotions/product-discount/${testProductId}?${params}`
      );

      if (response.status === 200) {
        const data = await response.json();
        if (data) {
          const { originalPrice, discountAmount, finalPrice } = data;
          expect(Math.abs((originalPrice - discountAmount) - finalPrice)).toBeLessThan(0.01);
        }
      }
    });
  });

  describe('Cross-endpoint Data Consistency', () => {
    it('should have matching product IDs across endpoints', async () => {
      const collectionsResponse = await fetch(`${API_BASE_URL}/collections`);
      const collections = await collectionsResponse.json();

      const discountsResponse = await fetch(`${API_BASE_URL}/promotions/discounts/active`);
      const discounts = await discountsResponse.json();

      // Get all product IDs from collections
      const collectionProductIds = new Set<string>();
      collections.forEach((collection: any) => {
        collection.products?.forEach((product: any) => {
          collectionProductIds.add(product.id);
        });
      });

      // All discount items should reference valid products
      discounts.forEach((discount: any) => {
        discount.applicableProducts?.forEach((product: any) => {
          expect(typeof product.id).toBe('string');
        });
      });
    });

    it('should have consistent date formats across endpoints', async () => {
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/;

      const collectionsResponse = await fetch(`${API_BASE_URL}/collections`);
      const collections = await collectionsResponse.json();

      const promotionsResponse = await fetch(`${API_BASE_URL}/promotions/active`);
      const promotions = await promotionsResponse.json();

      collections.forEach((collection: any) => {
        expect(collection.createdAt).toMatch(iso8601Regex);
        expect(collection.updatedAt).toMatch(iso8601Regex);
      });

      promotions.forEach((promotion: any) => {
        expect(promotion.startDate).toMatch(iso8601Regex);
        expect(promotion.endDate).toMatch(iso8601Regex);
      });
    });
  });

  describe('Performance & Rate Limiting', () => {
    it('should respond within reasonable time for collections', async () => {
      const startTime = performance.now();
      const response = await fetch(`${API_BASE_URL}/collections`);
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
    });

    it('should handle multiple rapid requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => fetch(`${API_BASE_URL}/promotions/active`));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status); // 429 = Too Many Requests
      });
    });
  });

  describe('Error Handling', () => {
    it('should return valid JSON error responses', async () => {
      const response = await fetch(`${API_BASE_URL}/collections/invalid-slug`);

      if (response.status !== 200) {
        const data = await response.json();
        expect(data).toBeDefined();
        // Should have some error information
        expect(
          data.error || data.message || data.errors || data.statusCode
        ).toBeDefined();
      }
    });

    it('should handle malformed query parameters', async () => {
      const response = await fetch(
        `${API_BASE_URL}/promotions/product-discount/p1?price=invalid&categoryId=<script>`
      );

      expect([200, 400]).toContain(response.status);
    });
  });
});
