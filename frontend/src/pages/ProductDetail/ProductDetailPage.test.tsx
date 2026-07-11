import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ProductDetailPage } from './ProductDetailPage';

const mocks = vi.hoisted(() => ({
  fetchPublicProductBySlugMock: vi.fn(),
  fetchPublicProductsMock: vi.fn(),
  fetchPublicCategoriesMock: vi.fn(),
  getProductDiscountMock: vi.fn(),
  addToCartMock: vi.fn(),
  toggleFavoriteMock: vi.fn(),
  syncFavoriteMock: vi.fn(),
  isFavoriteMock: vi.fn(() => false),
}));

vi.mock('../../services/productsService', () => ({
  fetchPublicProductBySlug: mocks.fetchPublicProductBySlugMock,
  fetchPublicProducts: mocks.fetchPublicProductsMock,
  mapApiProductToProduct: (apiProduct: any, categories: any[]) => ({
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    description: apiProduct.description || '',
    shortDescription: apiProduct.shortDescription || '',
    price: apiProduct.price || 0,
    images: apiProduct.images || [],
    category: categories.find((c) => c.id === apiProduct.categoryId) ?? { id: 'c1', name: 'Categoría', slug: 'categoria', isVisible: true },
    categoryId: apiProduct.categoryId,
    categoryIds: apiProduct.categoryIds || [],
    categories: categories,
    tags: apiProduct.tags || [],
    rating: apiProduct.rating || 0,
    reviewCount: apiProduct.reviewCount || 0,
    inStock: apiProduct.inStock ?? true,
    sku: apiProduct.sku || 'SKU-1',
    features: apiProduct.features || [],
    skus: apiProduct.skus || [],
  }),
}));

vi.mock('../../services/categoriesService', () => ({
  fetchPublicCategories: mocks.fetchPublicCategoriesMock,
}));

vi.mock('../../services/publicCollectionsService', () => ({
  publicCollectionsService: {
    getProductDiscount: mocks.getProductDiscountMock,
  },
}));

vi.mock('../../components/layout/context/CartContextUtils', () => ({
  useCart: () => ({ addToCart: mocks.addToCartMock }),
}));

vi.mock('../../components/layout/context/FavoritesContextUtils', () => ({
  useFavorites: () => ({
    isFavorite: mocks.isFavoriteMock,
    toggleFavorite: mocks.toggleFavoriteMock,
    syncFavorite: mocks.syncFavoriteMock,
  }),
}));

vi.mock('../../features/products/ProductCard/ProductCard', () => ({
  ProductCard: ({ product }: { product: { name: string } }) => <div>{product.name}</div>,
}));

vi.mock('../../components/ProductReviews/ProductReviews', () => ({
  ProductReviews: () => <div>Reviews</div>,
}));

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.fetchPublicCategoriesMock.mockResolvedValue([
      { id: 'cat-1', name: 'Categoría', slug: 'categoria', isVisible: true },
    ]);
    mocks.fetchPublicProductsMock.mockResolvedValue({ data: [] });
    mocks.getProductDiscountMock.mockResolvedValue(null);
  });

  it('resets quantity to 1 when changing to another product', async () => {
    mocks.fetchPublicProductBySlugMock
      .mockResolvedValueOnce({
        id: 'p1',
        slug: 'producto-1',
        name: 'Producto 1',
        description: 'Desc 1',
        price: 100,
        categoryId: 'cat-1',
        categoryIds: ['cat-1'],
        tags: [],
        rating: 4,
        reviewCount: 1,
        inStock: true,
        sku: 'SKU-1',
        images: ['img-1.jpg'],
        skus: [],
      })
      .mockResolvedValueOnce({
        id: 'p2',
        slug: 'producto-2',
        name: 'Producto 2',
        description: 'Desc 2',
        price: 200,
        categoryId: 'cat-1',
        categoryIds: ['cat-1'],
        tags: [],
        rating: 4,
        reviewCount: 1,
        inStock: true,
        sku: 'SKU-2',
        images: ['img-2.jpg'],
        skus: [],
      });

    const router = createMemoryRouter(
      [
        {
          path: '/producto/:slug',
          element: <ProductDetailPage />,
        },
      ],
      { initialEntries: ['/producto/producto-1'] }
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Producto 1' })).toBeInTheDocument();

    const quantityInput = screen.getByLabelText('Cantidad') as HTMLInputElement;
    fireEvent.change(quantityInput, { target: { value: '3' } });
    expect(quantityInput.value).toBe('3');

    await act(async () => {
      await router.navigate('/producto/producto-2');
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Producto 2' })).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Cantidad')).toHaveValue(1);
  });
});
