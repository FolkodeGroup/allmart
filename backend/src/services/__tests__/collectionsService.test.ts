import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/prisma', () => ({
  prisma: {
    collection: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const { prisma } = await import('../../config/prisma');
const { getCollectionsByDisplayPosition } = await import('../collectionsService');

describe('collectionsService.getCollectionsByDisplayPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the real category name for products in public home collections', async () => {
    (prisma.collection.findMany as any).mockResolvedValue([
      {
        id: 'col-1',
        name: 'Colección de cocina',
        slug: 'coleccion-de-cocina',
        description: null,
        displayOrder: 1,
        displayPosition: 'home',
        imageUrl: null,
        isActive: true,
        type: 'manual',
        params: {},
        snapshotAt: null,
        productCount: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        collectionItems: [
          {
            position: 1,
            product: {
              id: 'prod-1',
              name: 'Set de cocina',
              slug: 'set-de-cocina',
              price: 1200,
              imageUrl: null,
              productImages: [],
              productOptions: [],
              productSkus: [],
              productCategories: [
                {
                  category: {
                    id: 'cat-1',
                    name: 'Cocina',
                    slug: 'cocina',
                    description: null,
                    imageUrl: null,
                    parentId: null,
                    itemCount: 0,
                    isVisible: true,
                    createdAt: new Date('2024-01-01T00:00:00Z'),
                    updatedAt: new Date('2024-01-01T00:00:00Z'),
                  },
                },
              ],
            },
          },
        ],
      },
    ]);

    const result = await getCollectionsByDisplayPosition('home');

    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          collectionItems: expect.objectContaining({
            include: expect.objectContaining({
              product: expect.objectContaining({
                include: expect.objectContaining({
                  productCategories: {
                    include: { category: true },
                    orderBy: { createdAt: 'asc' },
                  },
                }),
              }),
            }),
          }),
        }),
      })
    );

    expect(result[0]?.products?.[0]).toEqual(expect.objectContaining({
      categoryName: 'Cocina',
      category: expect.objectContaining({
        name: 'Cocina',
        slug: 'cocina',
      }),
    }));
  });
});
