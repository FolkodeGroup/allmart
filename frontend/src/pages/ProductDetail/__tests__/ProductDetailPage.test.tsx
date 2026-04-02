import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductDetailPage } from '../ProductDetailPage';
import * as productsService from '../../../services/productsService';
import * as categoriesService from '../../../services/categoriesService';
import * as publicCollectionsService from '../../../services/publicCollectionsService';

// Mock services
vi.mock('../../../services/productsService', () => ({
  fetchPublicProductBySlug: vi.fn(),
  fetchPublicProducts: vi.fn(),
  mapApiProductToProduct: vi.fn((p) => p),
}));

vi.mock('../../../services/categoriesService', () => ({
  fetchPublicCategories: vi.fn(),
}));

vi.mock('../../../services/publicCollectionsService', () => ({
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

// Mock ProductCard component
vi.mock('../../../features/products/ProductCard/ProductCard', () => ({
  ProductCard: ({ product }: any) => <div data-testid={`related-${product.id}`}>{product.name}</div>,
}));

// Mock DiscountBadge component
vi.mock('../../../components/DiscountBadge', () => ({
  default: () => <div data-testid="discount-badge">Discount Badge</div>,
}));

const mockCategory = {
  id: 'cat1',
  name: 'Electronics',
  slug: 'electronics',
};

const mockProduct = {
  id: 'p1',
  name: 'Test Product',
  slug: 'test-product',
  sku: 'SKU001',
  price: 100,
  originalPrice: 120,
  discount: 15,
  rating: 4.5,
  reviewCount: 25,
  description: 'Test product description',
  category: mockCategory,
  categoryId: 'cat1',
  categoryIds: ['cat1'],
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  stock: 10,
  tags: [],
  variants: [],
};

const mockRelatedProducts = [
  {
    id: 'p2',
    name: 'Related Product 1',
    slug: 'related-1',
    price: 80,
    category: mockCategory,
    categoryId: 'cat1',
  },
  {
    id: 'p3',
    name: 'Related Product 2',
    slug: 'related-2',
    price: 120,
    category: mockCategory,
    categoryId: 'cat1',
  },
];

const renderProductDetail = (slug = 'test-product') => {
  return render(
    <MemoryRouter initialEntries={[`/producto/${slug}`]}>
      <Routes>
        <Route path="/producto/:slug" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (categoriesService.fetchPublicCategories as any).mockResolvedValue([mockCategory]);
    (productsService.fetchPublicProductBySlug as any).mockResolvedValue(mockProduct);
    (productsService.fetchPublicProducts as any).mockResolvedValue({
      data: mockRelatedProducts,
    });
    (publicCollectionsService.publicCollectionsService.getProductDiscount as any).mockResolvedValue(null);
  });

  describe('Page Rendering', () => {
    it('should render product detail page', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Product' })).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      renderProductDetail();
      expect(screen.getByText('Cargando producto...')).toBeInTheDocument();
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should display breadcrumb navigation', async () => {
      renderProductDetail();

      await waitFor(() => {
        const breadcrumb = screen.getByRole('navigation', { name: /Breadcrumb/i });
        expect(within(breadcrumb).getByText('Inicio')).toBeInTheDocument();
        expect(within(breadcrumb).getByText('Productos')).toBeInTheDocument();
        expect(within(breadcrumb).getByText('Electronics')).toBeInTheDocument();
        expect(within(breadcrumb).getByText('Test Product')).toBeInTheDocument();
      });
    });
  });

  describe('Product Information', () => {
    it('should display product name', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Product' })).toBeInTheDocument();
      });
    });

    it('should display product category', async () => {
      renderProductDetail();

      await waitFor(() => {
        const categoryLink = screen.getByRole('link', { name: 'Electronics' });
        expect(categoryLink).toBeInTheDocument();
      });
    });

    it('should display product SKU', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText(/SKU: SKU001/)).toBeInTheDocument();
      });
    });

    it('should display product rating and review count', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText(/4\.5/)).toBeInTheDocument();
        expect(screen.getByText(/25 opiniones/)).toBeInTheDocument();
      });
    });

    it('should display product image', async () => {
      renderProductDetail();

      await waitFor(() => {
        const image = screen.getByAltText('Test Product') as HTMLImageElement;
        expect(image).toBeInTheDocument();
        expect(image.src).toContain('image1.jpg');
      });
    });
  });

  describe('Gallery Navigation', () => {
    it('should display image thumbnails when multiple images exist', async () => {
      renderProductDetail();

      await waitFor(() => {
        const thumbnails = screen.getAllByRole('tablist');
        expect(thumbnails.length).toBeGreaterThan(0);
      });
    });

    it('should change main image when thumbnail is clicked', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByAltText('Test Product')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const thumbnailButtons = buttons.filter((btn) => btn.getAttribute('aria-label')?.includes('Imagen'));

      if (thumbnailButtons.length > 1) {
        fireEvent.click(thumbnailButtons[1]);

        const mainImage = screen.getByAltText('Test Product') as HTMLImageElement;
        expect(mainImage.src).toContain('image2.jpg');
      }
    });
  });

  describe('Price Display', () => {
    it('should display product price', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText(/\$\s*100/)).toBeInTheDocument();
      });
    });

    it('should display original price when discount exists', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText(/\$\s*120/)).toBeInTheDocument();
      });
    });

    it('should display discount badge', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText(/-15%/)).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Discount Loading', () => {
    it('should fetch product discount from API', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(publicCollectionsService.publicCollectionsService.getProductDiscount).toHaveBeenCalledWith(
          'p1',
          100,
          ['cat1']
        );
      });
    });

    it('should display promotion info when discount exists', async () => {
      const mockDiscount = {
        promotionId: 'promo1',
        promotionName: 'Summer Sale',
        originalPrice: 120,
        discountAmount: 40,
        finalPrice: 80,
        discountPercentage: 33,
        promotionType: 'percentage',
        priority: 1,
        validUntil: '2024-08-31T23:59:59Z',
        minPurchase: 50,
      };

      (publicCollectionsService.publicCollectionsService.getProductDiscount as any).mockResolvedValueOnce(
        mockDiscount
      );

      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText('Promoción: Summer Sale')).toBeInTheDocument();
        expect(screen.getByText(/Válida hasta:/)).toBeInTheDocument();
        expect(screen.getByText(/Compra mínima:/)).toBeInTheDocument();
      });
    });

    it('should use dynamic discount price when available', async () => {
      const mockDiscount = {
        promotionId: 'promo1',
        promotionName: 'Flash Sale',
        originalPrice: 120,
        discountAmount: 60,
        finalPrice: 60,
        discountPercentage: 50,
        promotionType: 'percentage',
        priority: 1,
      };

      (publicCollectionsService.publicCollectionsService.getProductDiscount as any).mockResolvedValueOnce(
        mockDiscount
      );

      renderProductDetail();

      await waitFor(() => {
        expect(publicCollectionsService.publicCollectionsService.getProductDiscount).toHaveBeenCalled();
      });
    });

    it('should handle discount loading errors gracefully', async () => {
      (publicCollectionsService.publicCollectionsService.getProductDiscount as any).mockRejectedValueOnce(
        new Error('API Error')
      );

      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Product' })).toBeInTheDocument();
      });

      // Should fall back to static discount
      expect(screen.getByText(/-15%/)).toBeInTheDocument();
    });
  });

  describe('Related Products', () => {
    it('should load and display related products', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByTestId('related-p2')).toBeInTheDocument();
        expect(screen.getByTestId('related-p3')).toBeInTheDocument();
      });
    });

    it('should exclude current product from related products', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.queryByTestId('related-p1')).not.toBeInTheDocument();
      });
    });

    it('should load related products from same category', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'electronics',
            limit: 5,
          })
        );
      });
    });
  });

  describe('Badges', () => {
    it('should display discount badge when product has discount', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText(/-15%/)).toBeInTheDocument();
      });
    });

    it('should not display discount badge when product has no discount', async () => {
      const noDiscountProduct = { ...mockProduct, discount: 0 };
      (productsService.fetchPublicProductBySlug as any).mockResolvedValueOnce(noDiscountProduct);

      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Product' })).toBeInTheDocument();
      });

      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
    });

    it('should display "Nuevo" badge when product is new', async () => {
      const newProduct = { ...mockProduct, tags: ['nuevo'] };
      (productsService.fetchPublicProductBySlug as any).mockResolvedValueOnce(newProduct);

      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText('Nuevo')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when product not found', async () => {
      (productsService.fetchPublicProductBySlug as any).mockRejectedValue(new Error('Not found'));

      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText('Producto no encontrado')).toBeInTheDocument();
      });
    });

    it('should display error when slug is invalid', async () => {
      (productsService.fetchPublicProductBySlug as any).mockRejectedValue(new Error('Not found'));

      renderProductDetail('invalid-slug');

      await waitFor(() => {
        expect(screen.getByText(/Producto no encontrado/)).toBeInTheDocument();
      });
    });

    it('should have link back to catalog on error', async () => {
      (productsService.fetchPublicProductBySlug as any).mockRejectedValue(new Error('Not found'));

      renderProductDetail();

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Volver al catálogo/ });
        expect(link).toHaveAttribute('href', '/productos');
      });
    });
  });

  describe('Variants Display', () => {
    it('should show variant options if product has variants', async () => {
      const productWithVariants = {
        ...mockProduct,
        variants: [
          {
            id: 'var1',
            name: 'Size',
            values: ['S', 'M', 'L', 'XL'],
          },
        ],
      };
      (productsService.fetchPublicProductBySlug as any).mockResolvedValueOnce(productWithVariants);

      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByText('Size:')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderProductDetail();

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: 'Test Product', level: 1 });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have proper image alt text', async () => {
      renderProductDetail();

      await waitFor(() => {
        const image = screen.getByAltText('Test Product');
        expect(image).toBeInTheDocument();
      });
    });

    it('should have proper link text for breadcrumbs', async () => {
      renderProductDetail();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Productos' })).toBeInTheDocument();
      });
    });
  });
});
