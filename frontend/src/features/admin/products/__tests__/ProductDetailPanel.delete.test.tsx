
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ProductDetailPanel } from '../ProductDetailPanel';
import type { AdminProduct } from '../../../../context/AdminProductsContext';
import AdminProductsContext, { type AdminProductsContextType } from '../../../../context/AdminProductsContext';
import { AdminVariantsProvider } from '../../../../context';
import { AdminAuthProvider } from '../../../../context/AdminAuthContext';
import { NotificationProvider } from '../../../../context/NotificationContext';

const defaultAdminProductsContext: AdminProductsContextType = {
  products: [],
  categories: [],
  loading: false,
  total: 0,
  page: 1,
  totalPages: 1,
  error: null,
  refreshProducts: vi.fn(),
  refreshCurrentPage: vi.fn(),
  addProduct: vi.fn() as any,
  updateProduct: vi.fn() as any,
  deleteProduct: vi.fn() as any,
  getProduct: vi.fn() as any,
  loadProductVariants: vi.fn() as any,
  getLowStockCount: vi.fn(),
  lowStockTotal: 0,
};

function TestWrapper({ children, contextValue }: { children: ReactNode; contextValue?: Partial<AdminProductsContextType> }) {
  const value = { ...defaultAdminProductsContext, ...contextValue } as AdminProductsContextType;
  return (
    <AdminAuthProvider>
      <NotificationProvider>
        <AdminProductsContext.Provider value={value}>
          <AdminVariantsProvider>
            {children}
          </AdminVariantsProvider>
        </AdminProductsContext.Provider>
      </NotificationProvider>
    </AdminAuthProvider>
  );
}

const mockProduct: AdminProduct = {
  id: 'prod-1',
  name: 'Test Product',
  sku: 'SKU-001',
  description: 'Test description',
  shortDescription: 'Short desc',
  price: 100,
  stock: 50,
  inStock: true,
  images: ['image.jpg'],
  categoryIds: ['cat-1'],
  category: { id: 'cat-1', name: 'Test Category', slug: 'test', isVisible: true },
  tags: [],
  features: [],
  rating: 4.5,
  reviewCount: 10,
  slug: 'test-product',
  variants: [],
  isFeatured: false,
};

describe('ProductDetailPanel - Delete Confirmation Modal', () => {
  it('should show delete confirmation modal when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <TestWrapper>
        <ProductDetailPanel product={mockProduct} onDelete={onDelete} canDelete={true} />
      </TestWrapper>
    );

    // Find and click the delete button
    const deleteButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.trim() === 'Eliminar'
    );
    const deleteButton = deleteButtons[deleteButtons.length - 1]; // Get last one which is in footer
    fireEvent.click(deleteButton);

    // Verify modal appears with product name
    await waitFor(() => {
      expect(screen.getByText(/¿Estás seguro de que deseas eliminar el producto "Test Product"\?/)).toBeInTheDocument();
      expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
    });
  });

  it('should cancel deletion when cancel button is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <TestWrapper>
        <ProductDetailPanel product={mockProduct} onDelete={onDelete} canDelete={true} />
      </TestWrapper>
    );

    // Click delete button
    const deleteButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.trim() === 'Eliminar'
    );
    const deleteButton = deleteButtons[deleteButtons.length - 1]; // Get last one which is in footer
    fireEvent.click(deleteButton);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/¿Estás seguro de que deseas eliminar el producto "Test Product"\?/)).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelButton);

    // Verify delete was not called
    expect(onDelete).not.toHaveBeenCalled();

    // Verify modal is hidden
    await waitFor(() => {
      expect(screen.queryByText(/¿Estás seguro de que deseas eliminar el producto "Test Product"\?/)).not.toBeInTheDocument();
    });
  });

  it('should call onDelete when confirm button is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <TestWrapper>
        <ProductDetailPanel product={mockProduct} onDelete={onDelete} canDelete={true} />
      </TestWrapper>
    );

    // Click delete button
    const deleteButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.trim() === 'Eliminar'
    );
    const deleteButton = deleteButtons[deleteButtons.length - 1]; // Get last one which is in footer
    fireEvent.click(deleteButton);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/¿Estás seguro de que deseas eliminar el producto "Test Product"\?/)).toBeInTheDocument();
    });

    // Click confirm button
    const confirmButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.trim() === 'Eliminar'
    );
    const confirmButton = confirmButtons[confirmButtons.length - 1]; // Get last one which is in modal
    fireEvent.click(confirmButton);

    // Verify delete was called with correct product ID
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('prod-1');
    });
  });

  it('should not show delete button when canDelete is false', () => {
    const onDelete = vi.fn();
    render(
      <TestWrapper>
        <ProductDetailPanel product={mockProduct} onDelete={onDelete} canDelete={false} />
      </TestWrapper>
    );

    // Verify delete button is not present in footer actions
    const deleteButtons = screen.queryAllByRole('button').filter(btn =>
      btn.textContent?.trim() === 'Eliminar'
    );
    expect(deleteButtons.length).toBe(0);
  });

  it('should show delete button when canDelete is true', () => {
    const onDelete = vi.fn();
    render(
      <TestWrapper>
        <ProductDetailPanel product={mockProduct} onDelete={onDelete} canDelete={true} />
      </TestWrapper>
    );

    // Verify delete button is present in footer
    const deleteButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.trim() === 'Eliminar'
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('should toggle inStock status when status button is clicked', async () => {
    const updateProduct = vi.fn().mockResolvedValue(undefined);
    render(
      <TestWrapper contextValue={{ updateProduct }}>
        <ProductDetailPanel product={mockProduct} canEdit={true} />
      </TestWrapper>
    );

    const inStockButton = screen.getByRole('button', { name: /Con Stock/i });
    fireEvent.click(inStockButton);

    await waitFor(() => {
      expect(updateProduct).toHaveBeenCalledWith('prod-1', { inStock: false });
      expect(inStockButton).toHaveTextContent('Sin stock');
    });
  });

  it('should toggle isFeatured status when featured button is clicked', async () => {
    const updateProduct = vi.fn().mockResolvedValue(undefined);
    render(
      <TestWrapper contextValue={{ updateProduct }}>
        <ProductDetailPanel product={mockProduct} canEdit={true} />
      </TestWrapper>
    );

    const featuredButton = screen.getByRole('button', { name: /No destacado/i });
    fireEvent.click(featuredButton);

    await waitFor(() => {
      expect(updateProduct).toHaveBeenCalledWith('prod-1', { isFeatured: true });
      expect(featuredButton).toHaveTextContent('Destacado');
    });
  });
});
