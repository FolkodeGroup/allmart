import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProductCard } from '../ProductCard';
import type { Product } from '../../../../types';

vi.mock('../../../../components/layout/context/FavoritesContextUtils', () => ({
  useFavorites: () => ({
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
    syncFavorite: vi.fn(),
  }),
}));

const product: Product & { stock?: number } = {
  id: 'prod-1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product',
  shortDescription: 'Test product short description',
  price: 100,
  images: ['https://example.com/image.jpg'],
  category: { id: 'cat-1', name: 'Cocina', slug: 'cocina', isVisible: true },
  tags: [],
  rating: 4.5,
  reviewCount: 10,
  inStock: true,
  sku: 'TEST-1',
  stock: 3,
};

describe('ProductCard', () => {
  it('does not render low stock badge for featured variant', () => {
    render(
      <BrowserRouter>
        <ProductCard product={product} variant="featured" />
      </BrowserRouter>
    );

    expect(screen.queryByText(/Stock bajo/i)).not.toBeInTheDocument();
  });

  it('renders low stock badge for default variant', () => {
    render(
      <BrowserRouter>
        <ProductCard product={product} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Stock bajo/i)).toBeInTheDocument();
  });
});
