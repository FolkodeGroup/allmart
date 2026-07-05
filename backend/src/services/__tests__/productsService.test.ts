import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../config/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    productTag: {
      findMany: vi.fn(),
    },
    // Agregar estos dos mocks para evitar excepciones al consultar descuentos en los tests
    promotion: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    promotionRule: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('../categoriesService', () => ({
  getCategoryBySlug: vi.fn(),
}));

const { prisma } = await import('../../config/prisma');
const { getCategoryBySlug } = await import('../categoriesService');
const { getPublicProducts } = await import('../productsService');

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('productsService.getPublicProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns no results for a hidden selected category', async () => {
    (getCategoryBySlug as any).mockResolvedValue({
      id: 'hidden-cat',
      slug: 'hidden-cat',
      name: 'Hidden',
      description: null,
      imageUrl: null,
      parentId: null,
      itemCount: 0,
      isVisible: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getPublicProducts({ category: 'hidden-cat' });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(prisma.product.count).not.toHaveBeenCalled();
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it('applies visibility filtering for public products without category filter', async () => {
    (prisma.product.count as any).mockResolvedValue(1);
    (prisma.product.findMany as any).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Visible Product',
        slug: 'visible-product',
        description: null,
        shortDescription: null,
        price: decimal(9990),
        images: [],
        categoryId: 'cat-1',
        tags: [],
        rating: decimal(4.5),
        reviewCount: 0,
        inStock: true,
        stock: 100,
        sku: 'SKU-1',
        features: [],
        isFeatured: false,
        primarySupplierId: null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        productCategories: [],
      },
    ]);

    const result = await getPublicProducts({});

    expect(prisma.product.count).toHaveBeenCalledTimes(1);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(2);

    const callWhere = (prisma.product.count as any).mock.calls[0][0].where;
    expect(callWhere).toEqual(expect.objectContaining({
      AND: [
        expect.objectContaining({
          productCategories: { some: { category: { isVisible: true } } },
        }),
      ],
    }));

    expect(result.total).toBe(1);
    expect(result.data[0]?.id).toBe('prod-1');
  });

  it('limits category filtering to visible child categories when a visible parent category is selected', async () => {
    (getCategoryBySlug as any).mockResolvedValue({
      id: 'parent-cat',
      slug: 'parent-cat',
      name: 'Parent',
      description: null,
      imageUrl: null,
      parentId: null,
      itemCount: 0,
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    (prisma.category.findMany as any).mockResolvedValue([
      { id: 'child-visible', parentId: 'parent-cat' },
    ]);

    (prisma.product.count as any).mockResolvedValue(0);
    (prisma.product.findMany as any).mockResolvedValue([]);

    await getPublicProducts({ category: 'parent-cat' });

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { parentId: 'parent-cat', isVisible: true },
      select: { id: true },
    });

    const callWhere = (prisma.product.count as any).mock.calls[0][0].where;
    expect(callWhere).toEqual({
      status: 'active',
      AND: [
        {
          productCategories: {
            some: {
              categoryId: {
                in: ['parent-cat', 'child-visible'],
              },
            },
          },
        },
        {
          productCategories: {
            some: {
              category: {
                isVisible: true,
              },
            },
          },
        },
      ],
    });
  });
});
