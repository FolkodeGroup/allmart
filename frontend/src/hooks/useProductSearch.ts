// hooks/useProductSearch.ts
import { useMemo } from 'react';
import type { Product, Category } from '../types';

interface Params {
    query: string;
    products: Product[];
    categories: Category[];
}

export function useProductSearch({ query, products }: Omit<Params, 'categories'>) {
    const normalizedQuery = query.toLowerCase().trim();
    return useMemo(() => {
        if (!normalizedQuery) return [];

        return products.filter((product) => {
            const nameMatch = product.name?.toLowerCase().includes(normalizedQuery);
            const skuMatch = (product.sku ?? '').toLowerCase().includes(normalizedQuery);

            // Only match by name or SKU (no description, tags or category matches)
            return Boolean(nameMatch || skuMatch);
        });
    }, [normalizedQuery, products]);
}