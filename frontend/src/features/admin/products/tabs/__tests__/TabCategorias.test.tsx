import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TabCategorias } from '../TabCategorias';

const categories = [
  { id: 'cat-1', name: 'Electrónica', slug: 'electronica', parentId: null, isVisible: true },
  { id: 'cat-2', name: 'Celulares', slug: 'celulares', parentId: 'cat-1', isVisible: true },
];

const baseForm = {
  name: 'Producto',
  slug: 'producto',
  description: '',
  shortDescription: '',
  price: 100,
  images: [''],
  category: { id: '', name: '', slug: '', isVisible: true },
  categoryIds: [],
  tags: [],
  rating: 0,
  reviewCount: 0,
  inStock: true,
  isFeatured: false,
  sku: 'SKU-1',
  features: [],
  stock: 10,
  variants: [],
  primarySupplierId: null,
};

describe('TabCategorias', () => {
  it('deshabilita la acción de agregar categorías adicionales si no hay categoría principal seleccionada', () => {
    render(
      <TabCategorias
        form={baseForm}
        fieldErrors={{}}
        setField={vi.fn()}
        categories={categories}
        additionalCategoryIds={[]}
        onPrimaryCategoryChange={vi.fn()}
        onAdditionalCategoriesChange={vi.fn()}
        getCategoryLabel={(category) => category.parentId ? `${categories[0].name} > ${category.name}` : category.name}
      />
    );

    const button = screen.getByRole('button', { name: 'Seleccione primero una categoría principal' });
    expect(button).toBeDisabled();
    expect(button.getAttribute('title')).toBe('Seleccione primero una categoría principal');
    expect(screen.getByText('Seleccione primero una categoría principal')).toBeTruthy();
  });
});
