import { describe, expect, it } from 'vitest';
import { getFirstErrorKey, getFieldFocusSelector } from '../productFormFocus';

describe('productFormFocus', () => {
  it('prioritizes the first invalid field in the form order', () => {
    expect(
      getFirstErrorKey({
        category: 'Seleccioná una categoría',
        name: 'El nombre es obligatorio',
        price: 'El precio es obligatorio',
        sku: 'El SKU es obligatorio',
      })
    ).toBe('name');

    expect(
      getFirstErrorKey({
        price: 'El precio es obligatorio',
        sku: 'El SKU es obligatorio',
        slug: 'Slug inválido',
      })
    ).toBe('sku');
  });

  it('maps each invalid field to the correct focus selector', () => {
    expect(getFieldFocusSelector('name')).toBe('#product-name');
    expect(getFieldFocusSelector('sku')).toBe('#product-sku');
    expect(getFieldFocusSelector('category')).toBe('#product-category-trigger');
    expect(getFieldFocusSelector('price')).toBe('#product-price');
  });
});
