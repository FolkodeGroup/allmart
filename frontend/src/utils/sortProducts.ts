import type { ExportableProduct } from './exportProducts';

export type SortField = 'name' | 'price' | 'stock' | 'inStock' | 'category';
export type SortDirection = 'asc' | 'desc';

export function sortProducts<T extends ExportableProduct>(
  products: T[],
  field: SortField,
  direction: SortDirection
): T[] {
  const sorted = [...products].sort((a, b) => {
    let aValue: string | number | boolean | undefined = a[field] as string | number | boolean | undefined;
    let bValue: string | number | boolean | undefined = b[field] as string | number | boolean | undefined;

    // Para categoría, comparar por nombre
    if (field === 'category') {
      aValue = a.category?.toLowerCase() || '';
      bValue = b.category?.toLowerCase() || '';
    }
    // Para nombre, comparar insensible a mayúsculas
    if (field === 'name') {
      aValue = a.name?.toLowerCase() || '';
      bValue = b.name?.toLowerCase() || '';
    }
    // Para estado (inStock), true > false
    if (field === 'inStock') {
      aValue = a.inStock ? 1 : 0;
      bValue = b.inStock ? 1 : 0;
    }
    // Para números
    if (field === 'price' || field === 'stock') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if ((aValue ?? '') < (bValue ?? '')) return direction === 'asc' ? -1 : 1;
    if ((aValue ?? '') > (bValue ?? '')) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}
