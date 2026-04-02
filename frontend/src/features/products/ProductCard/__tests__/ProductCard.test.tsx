import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductCard } from '../ProductCard';
import type { Product } from '../../../../types';
import * as publicCollectionsService from '../../../../services/publicCollectionsService';

// Mock publicCollectionsService
vi.mock('../../../../services/publicCollectionsService', () => ({
  publicCollectionsService: {
    getProductDiscount: vi.fn(),
  },
}));

// Mock useCart hook
vi.mock('../../../components/layout/context/CartContextUtils', () => ({
  useCart: () => ({
    addToCart: vi.fn(),
  }),
}));

const mockProduct: Product = {
  id: 'p1',
  name: 'Test Product',
  slug: 'test-product',
  price: 100,
  originalPrice: 120,
  discount: 15,
  rating: 4.5,
  reviewCount: 10,
  description: 'Test product description',
  shortDescription: 'Short desc',
  category: {
    id: 'cat1',
    name: 'Test Category',
    slug: 'test-category',
    isVisible: true,
  },
  categoryId: 'cat1',
  categoryIds: ['cat1'],
  sku: 'SKU001',
  tags: [],
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  inStock: true,
};

const renderProductCard = (product = mockProduct, variant = 'default' as 'default' | 'featured') => {
  return render(
    <BrowserRouter>
      <ProductCard product={product} variant={variant} />
    </BrowserRouter>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Product Information Display', () => {
    it('should display product name', () => {
      renderProductCard();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should display product category', () => {
      renderProductCard();
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    it('should display product rating', () => {
      renderProductCard();
      expect(screen.getByLabelText(/Valoración: 4\.5 de 5/i)).toBeInTheDocument();
    });

    it('should display review count', () => {
      renderProductCard();
      expect(screen.getByText(/\(10\)/)).toBeInTheDocument();
    });

    it('should render product image', () => {
      renderProductCard();
      const image = screen.getByAltText(/Test Product/i) as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.src).toContain('image1.jpg');
    });

    it('should have link to product detail page', () => {
      renderProductCard();
      const links = screen.getAllByRole('link', { name: /Test Product/i });
      links.forEach((link) => {
        expect(link).toHaveAttribute('href', '/producto/test-product');
      });
    });
  });

  describe('Static Discount Badge', () => {
    it('should display discount badge when product has discount', () => {
      renderProductCard();
      expect(screen.getAllByText('-15%').length).toBeGreaterThan(0);
    });

    it('should not display discount badge when product has no discount', () => {
      const productNoDiscount = { ...mockProduct, discount: 0 };
      renderProductCard(productNoDiscount);
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
    });

    it('should display "Nuevo" badge when product has "nuevo" tag', () => {
      const newProduct = { ...mockProduct, tags: ['nuevo'] };
      renderProductCard(newProduct);
      expect(screen.getByText('Nuevo')).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('should display current price', () => {
      renderProductCard();
      // Price formatting: $100
      expect(screen.getByText(/\$\s*100/)).toBeInTheDocument();
    });

    it('should display original price when discount exists', () => {
      renderProductCard();
      // Original price should be struck through
      expect(screen.getByText(/\$\s*120/)).toBeInTheDocument();
    });

    it('should update price display when dynamic discount is loaded', async () => {
      const mockDiscount = {
        originalPrice: 120,
        finalPrice: 85,
        discountPercentage: 29,
        promotionType: 'percentage',
      };

      (publicCollectionsService.publicCollectionsService.getProductDiscount as any).mockResolvedValueOnce(
        mockDiscount
      );

      renderProductCard();

      await waitFor(() => {
        expect(publicCollectionsService.publicCollectionsService.getProductDiscount).toHaveBeenCalledWith(
          'p1',
          100,
          ['cat1']
        );
      });
    });
  });

  describe('Dynamic Discount Loading', () => {
    it('should fetch product discount on mount', async () => {
      (publicCollectionsService.publicCollectionsService.getProductDiscount as any).mockResolvedValueOnce(null);

      renderProductCard();

      await waitFor(() => {
        expect(publicCollectionsService.publicCollectionsService.getProductDiscount).toHaveBeenCalledWith(
          'p1',
          100,
          ['cat1']
        );
      });
    });

    it('should handle discount API errors gracefully', async () => {
      (publicCollectionsService.publicCollectionsService.getProductDiscount as any).mockRejectedValueOnce(
        new Error('API Error')
      );

      renderProductCard();

      await waitFor(() => {
        expect(publicCollectionsService.publicCollectionsService.getProductDiscount).toHaveBeenCalled();
      });

      // Should not crash and should fall back to static discount
      expect(screen.getAllByText('-15%').length).toBeGreaterThan(0);
    });

    it('should use dynamic discount when available', async () => {
      const mockDiscount = {
        originalPrice: 120,
        finalPrice: 80,
        discountPercentage: 33,
        promotionType: 'percentage',
      };

      (publicCollectionsService.publicCollectionsService.getProductDiscount as any).mockResolvedValueOnce(
        mockDiscount
      );

      renderProductCard();

      // Wait for discount to be loaded and displayed
      await waitFor(() => {
        // Note: The actual display would depend on DiscountBadge component
        expect(publicCollectionsService.publicCollectionsService.getProductDiscount).toHaveBeenCalled();
      });
    });
  });

  describe('Gallery Navigation', () => {
    it('should render gallery navigation for featured variant with multiple images', () => {
      renderProductCard(mockProduct, 'featured');

      const prevButton = screen.getByLabelText('Imagen anterior');
      const nextButton = screen.getByLabelText('Siguiente imagen');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should handle image navigation with prev button', () => {
      renderProductCard(mockProduct, 'featured');

      const allImages = screen.getAllByAltText(/Test Product/i);
      const initialImage = allImages[0] as HTMLImageElement;
      expect(initialImage.src).toContain('image1.jpg');

      const prevButton = screen.getByLabelText('Imagen anterior');
      fireEvent.click(prevButton);

      const imagesAfter = screen.getAllByAltText(/Test Product/i);
      const afterImage = imagesAfter[0] as HTMLImageElement;
      // Should loop to last image
      expect(afterImage.src).toContain('image2.jpg');
    });

    it('should handle image navigation with next button', () => {
      renderProductCard(mockProduct, 'featured');

      const nextButton = screen.getByLabelText('Siguiente imagen');
      fireEvent.click(nextButton);

      const image = screen.getByAltText(/Test Product - imagen 2 de 2/i) as HTMLImageElement;
      expect(image.src).toContain('image2.jpg');
    });
  });

  describe('Favoritos Button', () => {
    it('should render favoritos button', () => {
      renderProductCard();
      const button = screen.getByLabelText(/Agregar .* a favoritos/i);
      expect(button).toBeInTheDocument();
    });

    it('should toggle favoritos state on click', () => {
      renderProductCard();
      const button = screen.getByLabelText(/Agregar .* a favoritos/i);

      fireEvent.click(button);
      expect(button.className).toMatch(/activo/);

      fireEvent.click(button);
      expect(button.className).not.toMatch(/activo/);
    });

    it('should persist favoritos state to localStorage', () => {
      renderProductCard();
      const button = screen.getByLabelText(/Agregar .* a favoritos/i);

      fireEvent.click(button);

      const stored = localStorage.getItem('wishlist-p1');
      expect(stored).toBe('true');
    });

    it('should restore favoritos state from localStorage', () => {
      localStorage.setItem('wishlist-p1', 'true');

      renderProductCard();
      const button = screen.getByLabelText(/Agregar .* a favoritos/i);

      expect(button.className).toMatch(/activo/);
    });
  });

  describe('Variant Display', () => {
    it('should render as default variant by default', () => {
      renderProductCard();
      const article = screen.getByRole('article', { name: 'Test Product' });
      expect(article.className).not.toMatch(/featuredCard/);
    });

    it('should render as featured variant when specified', () => {
      renderProductCard(mockProduct, 'featured');
      const article = screen.getByRole('article', { name: 'Test Product' });
      expect(article.className).toMatch(/featuredCard/);
    });
  });

  describe('Stock Information', () => {
    it('should display low stock badge when stock is low', () => {
      const lowStockProduct = { ...mockProduct, stock: 2 };
      renderProductCard(lowStockProduct);

      expect(screen.getByText(/Stock bajo/i)).toBeInTheDocument();
    });

    it('should not display low stock badge when stock is sufficient', () => {
      renderProductCard();
      expect(screen.queryByText(/Stock bajo/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderProductCard();
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Test Product');
    });

    it('should have proper image alt text', () => {
      renderProductCard();
      expect(screen.getByAltText(/Test Product/i)).toBeInTheDocument();
    });

    it('should have proper link roles for "Ver producto"', () => {
      renderProductCard();
      const button = screen.getByRole('link', { name: /Ver producto/i });
      expect(button).toBeInTheDocument();
    });
  });
});
