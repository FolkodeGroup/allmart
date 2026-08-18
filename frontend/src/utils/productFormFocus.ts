export const PRODUCT_FORM_ERROR_PRIORITY = [
  'name',
  'sku',
  'slug',
  'price',
  'category',
  'stock',
  'images',
  'variants',
] as const;

export function getFirstErrorKey(errors: Record<string, string>): string | undefined {
  for (const key of PRODUCT_FORM_ERROR_PRIORITY) {
    if (errors[key]) return key;
  }

  return Object.keys(errors)[0];
}

export function getFieldFocusSelector(fieldKey: string): string {
  const selectors: Record<string, string> = {
    name: '#product-name',
    sku: '#product-sku',
    slug: '#product-slug',
    price: '#product-price',
    stock: '#product-stock',
    category: '#product-category-trigger',
    images: '#product-image-upload',
    variants: '#variantes',
  };

  return selectors[fieldKey] || '#product-name';
}
