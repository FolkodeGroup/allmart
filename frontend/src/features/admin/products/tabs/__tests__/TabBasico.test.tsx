import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TabBasico } from '../TabBasico';

function TestHarness() {
  const [form, setForm] = useState({
    name: 'Producto demo',
    slug: 'producto-demo',
    description: '',
    shortDescription: '',
    price: 100,
    images: [''],
    category: { id: 'cat-1', name: 'Categoría', slug: 'categoria', isVisible: true },
    categoryIds: ['cat-1'],
    tags: [] as string[],
    rating: 0,
    reviewCount: 0,
    inStock: true,
    isFeatured: false,
    sku: 'SKU-1',
    features: [] as string[],
    stock: 10,
    variants: [],
    primarySupplierId: null as string | null,
  });

  const setField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value } as typeof prev));
  };

  return (
    <TabBasico
      form={form as any}
      errors={{}}
      setField={setField as any}
      tagInput=""
      setTagInput={vi.fn()}
      featureInput=""
      setFeatureInput={vi.fn()}
      onAddTag={vi.fn()}
      onRemoveTag={vi.fn()}
      onAddFeature={vi.fn()}
      onRemoveFeature={vi.fn()}
    />
  );
}

describe('TabBasico', () => {
  it('renders the three label checkboxes and updates form state when they are toggled', () => {
    render(<TestHarness />);

    expect(screen.getByLabelText('En Oferta')).toBeTruthy();
    expect(screen.getByLabelText('Novedad')).toBeTruthy();
    expect(screen.getByLabelText('Producto Destacado')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('En Oferta'));
    fireEvent.click(screen.getByLabelText('Novedad'));
    fireEvent.click(screen.getByLabelText('Producto Destacado'));

    expect(screen.getByLabelText('En Oferta')).toBeChecked();
    expect(screen.getByLabelText('Novedad')).toBeChecked();
    expect(screen.getByLabelText('Producto Destacado')).toBeChecked();
  });
});
