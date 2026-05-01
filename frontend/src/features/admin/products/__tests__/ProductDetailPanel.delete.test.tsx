/**
 * frontend/src/features/admin/products/__tests__/ProductDetailPanel.delete.test.tsx
 * Tests para la confirmación de eliminación en el panel de detalle del producto.
 * Verifica que aparece un modal de confirmación antes de eliminar un producto desde el detalle.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProductDetailPanel } from '../ProductDetailPanel';
import type { AdminProduct } from '../../../../context/AdminProductsContext';

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
      <ProductDetailPanel
        product={mockProduct}
        onDelete={onDelete}
        canDelete={true}
      />
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
      <ProductDetailPanel
        product={mockProduct}
        onDelete={onDelete}
        canDelete={true}
      />
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
      <ProductDetailPanel
        product={mockProduct}
        onDelete={onDelete}
        canDelete={true}
      />
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
      <ProductDetailPanel
        product={mockProduct}
        onDelete={onDelete}
        canDelete={false}
      />
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
      <ProductDetailPanel
        product={mockProduct}
        onDelete={onDelete}
        canDelete={true}
      />
    );

    // Verify delete button is present in footer
    const deleteButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent?.trim() === 'Eliminar'
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
  });
});
