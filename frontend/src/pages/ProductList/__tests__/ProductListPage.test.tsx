import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductListPage } from '../ProductListPage';
import * as productsService from '../../../services/productsService';
import * as categoriesService from '../../../services/categoriesService';
import * as publicCollectionsService from '../../../services/publicCollectionsService';

// Mock services
vi.mock('../../../services/productsService', () => ({
  fetchPublicProducts: vi.fn(),
  mapApiProductToProduct: vi.fn((p) => p),
  PublicProductsParams: {},
}));

vi.mock('../../../services/categoriesService', () => ({
  fetchPublicCategories: vi.fn(),
}));

vi.mock('../../../services/publicCollectionsService', () => ({
  publicCollectionsService: {
    getActiveDiscounts: vi.fn(),
  },
}));

// Mock ProductCard component
vi.mock('../../../features/products/ProductCard/ProductCard', () => ({
  ProductCard: ({ product }: any) => <div data-testid={`product-${product.id}`}>{product.name}</div>,
}));

const mockCategories = [
  { id: 'cat1', name: 'Electronics', slug: 'electronics', parentId: null },
  { id: 'cat2', name: 'Clothing', slug: 'clothing', parentId: null },
];

const mockProducts = [
  {
    id: 'p1',
    name: 'Product 1',
    slug: 'product-1',
    price: 100,
    category: mockCategories[0],
    categoryId: 'cat1',
    rating: 4,
    reviewCount: 5,
    images: [],
    tags: [],
  },
  {
    id: 'p2',
    name: 'Product 2',
    slug: 'product-2',
    price: 200,
    category: mockCategories[1],
    categoryId: 'cat2',
    rating: 4.5,
    reviewCount: 10,
    images: [],
    tags: [],
  },
];

const mockActiveDiscounts = [
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

const renderProductListPage = () => {
  return render(
    <BrowserRouter>
      <ProductListPage />
    </BrowserRouter>
  );
};

const expectResultCount = (count: number) => {
  const matcher = (_: string, element: Element | null) => {
    if (!element) return false;
    const normalized = element.textContent?.replace(/\s+/g, ' ').trim();
    return normalized === `Mostrando ${count} productos`;
  };

  expect(screen.getByText(matcher)).toBeInTheDocument();
};

describe('ProductListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (categoriesService.fetchPublicCategories as any).mockResolvedValue(mockCategories);
    (productsService.fetchPublicProducts as any).mockResolvedValue({
      data: mockProducts,
    });
    (publicCollectionsService.publicCollectionsService.getActiveDiscounts as any).mockResolvedValue(
      mockActiveDiscounts
    );
  });

  describe('Page Rendering', () => {
    it('should render the products list page', async () => {
      renderProductListPage();
      
      await waitFor(() => {
        expect(screen.getByText('Productos')).toBeInTheDocument();
      });
    });

    it('should display breadcrumb navigation', async () => {
      renderProductListPage();
      
      await waitFor(() => {
        expect(screen.getByText('Inicio')).toBeInTheDocument();
        expect(screen.getByText('Productos')).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      renderProductListPage();
      expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
    });
  });

  describe('Product Loading', () => {
    it('should load products on mount', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalledWith({
          limit: 48,
        });
      });
    });

    it('should display products after loading', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(screen.getByTestId('product-p1')).toBeInTheDocument();
        expect(screen.getByTestId('product-p2')).toBeInTheDocument();
      });
    });

    it('should display error message when loading fails', async () => {
      (productsService.fetchPublicProducts as any).mockRejectedValueOnce(new Error('Load failed'));

      renderProductListPage();

      await waitFor(() => {
        expect(screen.getByText('Error al cargar productos')).toBeInTheDocument();
        expect(screen.getByText('Load failed')).toBeInTheDocument();
      });
    });

    it('should handle empty product list', async () => {
      (productsService.fetchPublicProducts as any).mockResolvedValueOnce({
        data: [],
      });

      renderProductListPage();

      await waitFor(() => {
        expect(screen.getByText('No encontramos productos')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('should have sort options available', async () => {
      renderProductListPage();

      await waitFor(() => {
        const sortSelect = screen.getByDisplayValue('Relevancia');
        expect(sortSelect).toBeInTheDocument();
      });
    });

    it('should change sort when option is selected', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalled();
      });

      const sortSelect = screen.getByDisplayValue('Relevancia') as HTMLSelectElement;
      fireEvent.change(sortSelect, { target: { value: 'price_asc' } });

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'price_asc',
          })
        );
      });
    });

    it('should request products with sort parameter', async () => {
      renderProductListPage();

      const sortSelect = screen.getByDisplayValue('Relevancia') as HTMLSelectElement;
      fireEvent.change(sortSelect, { target: { value: 'price_desc' } });

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'price_desc',
          })
        );
      });
    });
  });

  describe('Category Filtering', () => {
    it('should display category filter checkboxes', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Electronics')).toBeInTheDocument();
        expect(screen.getByLabelText('Clothing')).toBeInTheDocument();
      });
    });

    it('should filter products by category', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Electronics')).toBeInTheDocument();
      });

      const electronicsCheckbox = screen.getByLabelText('Electronics');
      fireEvent.click(electronicsCheckbox);

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'electronics',
          })
        );
      });
    });

    it('should clear category filter when unchecked', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(screen.getByLabelText('Electronics')).toBeInTheDocument();
      });

      const electronicsCheckbox = screen.getByLabelText('Electronics');
      fireEvent.click(electronicsCheckbox);

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'electronics',
          })
        );
      });

      fireEvent.click(electronicsCheckbox);

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalledWith({
          limit: 48,
        });
      });
    });
  });

  describe('En Oferta Filter', () => {
    it('should display "En oferta" checkbox in tags section', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/En oferta/i)).toBeInTheDocument();
      });
    });

    it('should load active discounts on mount', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(publicCollectionsService.publicCollectionsService.getActiveDiscounts).toHaveBeenCalled();
      });
    });

    it('should filter products when "En oferta" checkbox is checked', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('product-p1')).toBeInTheDocument();
      });

      const enOfertaCheckbox = screen.getByLabelText(/En oferta/i);
      fireEvent.click(enOfertaCheckbox);

      await waitFor(() => {
        // Should only display product p1 which has an active discount
        expect(screen.getByTestId('product-p1')).toBeInTheDocument();
        expect(screen.queryByTestId('product-p2')).not.toBeInTheDocument();
      });
    });

    it('should show loading state while discounts are loading', () => {
      (publicCollectionsService.publicCollectionsService.getActiveDiscounts as any).mockImplementation(
        () => new Promise(() => {})
      );

      renderProductListPage();

      expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
    });

    it('should handle discount loading errors gracefully', async () => {
      (publicCollectionsService.publicCollectionsService.getActiveDiscounts as any).mockRejectedValueOnce(
        new Error('Failed to load discounts')
      );

      renderProductListPage();

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalled();
      });

      // Should not crash and should still allow filtering
      const enOfertaCheckbox = screen.getByLabelText(/En oferta/i);
      expect(enOfertaCheckbox).toBeInTheDocument();
    });

    it('should reset "En oferta" filter when unchecked', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('product-p1')).toBeInTheDocument();
      });

      const enOfertaCheckbox = screen.getByLabelText(/En oferta/i);
      fireEvent.click(enOfertaCheckbox);

      await waitFor(() => {
        expect(screen.getByTestId('product-p1')).toBeInTheDocument();
      });

      fireEvent.click(enOfertaCheckbox);

      await waitFor(() => {
        // Should show both products again
        expect(screen.getByTestId('product-p1')).toBeInTheDocument();
        expect(screen.getByTestId('product-p2')).toBeInTheDocument();
      });
    });

    it('should work with multiple filters combined', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Electronics')).toBeInTheDocument();
      });

      const electronicsCheckbox = screen.getByLabelText('Electronics');
      const enOfertaCheckbox = screen.getByLabelText(/En oferta/i);

      fireEvent.click(electronicsCheckbox);
      fireEvent.click(enOfertaCheckbox);

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'electronics',
          })
        );
      });
    });
  });

  describe('Result Count', () => {
    it('should display number of products shown', async () => {
      renderProductListPage();

      await waitFor(() => {
        expectResultCount(2);
      });
    });

    it('should update count when filtering', async () => {
      renderProductListPage();

      await waitFor(() => {
        expectResultCount(2);
      });

      await waitFor(() => {
        expect(screen.getByTestId('product-p1')).toBeInTheDocument();
      });

      const enOfertaCheckbox = screen.getByLabelText(/En oferta/i);
      fireEvent.click(enOfertaCheckbox);

      await waitFor(() => {
        expectResultCount(1);
      });
    });
  });

  describe('Mobile Filters Toggle', () => {
    it('should display mobile filter button', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(screen.getByText(/☰ Filtros/)).toBeInTheDocument();
      });
    });

    it('should toggle filters visibility on mobile button click', async () => {
      const { container } = renderProductListPage();

      await waitFor(() => {
        expect(screen.getByText(/☰ Filtros/)).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /☰ Filtros/ });
      const sidebar = container.querySelector('[aria-label="Filtros de productos"]') as HTMLElement;

      expect(sidebar.className).not.toMatch(/open/);

      fireEvent.click(filterButton);
      expect(sidebar.className).toMatch(/open/);

      fireEvent.click(filterButton);
      expect(sidebar.className).not.toMatch(/open/);
    });
  });

  describe('Categories Loading', () => {
    it('should load categories on mount', async () => {
      renderProductListPage();

      await waitFor(() => {
        expect(categoriesService.fetchPublicCategories).toHaveBeenCalled();
      });
    });

    it('should handle category loading errors', async () => {
      (categoriesService.fetchPublicCategories as any).mockRejectedValueOnce(new Error('Failed'));

      renderProductListPage();

      await waitFor(() => {
        expect(productsService.fetchPublicProducts).toHaveBeenCalled();
      });

      // Should still render with empty categories
      expect(screen.getByText(/Productos/)).toBeInTheDocument();
    });
  });
});
