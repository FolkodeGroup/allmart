import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductListPage } from './ProductListPage';

const { fetchPublicProductsMock, fetchPublicCategoriesMock } = vi.hoisted(() => ({
    fetchPublicProductsMock: vi.fn(async () => ({ data: [], total: 0 })),
    fetchPublicCategoriesMock: vi.fn(async () => [
        { id: 'cat-cocina', name: 'Cocina', slug: 'cocina', isVisible: true, parentId: null },
    ]),
}));

vi.mock('../../services/productsService', () => ({
    fetchPublicProducts: fetchPublicProductsMock,
    mapApiProductToProduct: () => ({
        id: 'p-1',
        name: 'Producto',
        slug: 'producto',
        description: '',
        shortDescription: '',
        price: 100,
        images: [],
        category: { id: 'cat-cocina', name: 'Cocina', slug: 'cocina', isVisible: true },
        categoryId: 'cat-cocina',
        categoryIds: ['cat-cocina'],
        tags: [],
        rating: 0,
        reviewCount: 0,
        inStock: true,
        sku: 'sku',
    }),
}));

vi.mock('../../services/categoriesService', () => ({
    fetchPublicCategories: fetchPublicCategoriesMock,
}));

vi.mock('../../services/publicCollectionsService', () => ({
    publicCollectionsService: {
        getCollectionsByPosition: vi.fn(async () => []),
        getCollectionBySlug: vi.fn(async () => ({ id: 'c-1', name: 'Colección', slug: 'coleccion', products: [], productCount: 0, displayOrder: 0, displayPosition: 'category', isActive: true, createdAt: '', updatedAt: '' })),
    },
}));

describe('ProductListPage', () => {
    beforeEach(() => {
        fetchPublicProductsMock.mockClear();
        fetchPublicCategoriesMock.mockClear();
    });

    it('reads the category from the URL and keeps the breadcrumb current label aligned with the selected category', async () => {
        render(
            <MemoryRouter initialEntries={['/productos?category=cocina']}>
                <ProductListPage />
            </MemoryRouter>
        );

        expect(fetchPublicProductsMock).toHaveBeenCalled();
        const call = fetchPublicProductsMock.mock.calls.at(-1)?.[0];
        expect(call).toMatchObject({ category: 'cocina' });
        expect(await screen.findByText('Cocina')).toBeTruthy();
    });
});
