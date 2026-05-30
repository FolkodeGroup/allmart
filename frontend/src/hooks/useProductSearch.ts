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
            const nameMatch = product.name.toLowerCase().includes(normalizedQuery);

            const categoryMatch =
                product.category?.name.toLowerCase().includes(normalizedQuery) ||
                product.categories?.some((c) =>
                    c.name.toLowerCase().includes(normalizedQuery)
                );

            const tagsMatch = product.tags?.some((tag) =>
                tag.toLowerCase().includes(normalizedQuery)
            );

            return nameMatch || categoryMatch || tagsMatch;
        });
    }, [normalizedQuery, products]);
}