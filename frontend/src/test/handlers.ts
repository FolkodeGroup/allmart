import { http, HttpResponse } from 'msw';

const now = new Date();
const isoNow = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
const isoTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  .toISOString()
  .replace(/\.\d{3}Z$/, 'Z');

const collectionProducts = [
  {
    id: 'p1',
    name: 'Product 1',
    slug: 'product-1',
    price: 100,
    imageUrl: 'https://example.com/p1.jpg',
    position: 1,
  },
  {
    id: 'p2',
    name: 'Product 2',
    slug: 'product-2',
    price: 200,
    imageUrl: 'https://example.com/p2.jpg',
    position: 2,
  },
];

const collections = [
  {
    id: 'col1',
    name: 'Summer Collection',
    slug: 'summer-collection',
    description: 'Seasonal picks',
    displayOrder: 1,
    displayPosition: 'home',
    imageUrl: 'https://example.com/col1.jpg',
    isActive: true,
    productCount: collectionProducts.length,
    createdAt: isoNow,
    updatedAt: isoNow,
    products: collectionProducts,
  },
  {
    id: 'col2',
    name: 'Category Picks',
    slug: 'category-picks',
    description: 'Category highlights',
    displayOrder: 2,
    displayPosition: 'category',
    imageUrl: 'https://example.com/col2.jpg',
    isActive: true,
    productCount: 0,
    createdAt: isoNow,
    updatedAt: isoNow,
    products: [],
  },
];

const activePromotions = [
  {
    id: 'promo1',
    name: 'Summer Promo',
    description: 'Seasonal discount',
    type: 'percentage',
    value: 20,
    startDate: isoNow,
    endDate: isoTomorrow,
    minPurchaseAmount: 50,
    maxDiscount: 200,
    isActive: true,
    priority: 1,
    createdAt: isoNow,
    updatedAt: isoNow,
  },
];

const activeDiscounts = [
  {
    promotionId: 'promo1',
    promotionName: 'Summer Promo',
    originalPrice: 100,
    discountAmount: 20,
    finalPrice: 80,
    discountPercentage: 20,
    applicableProducts: [{ id: 'p1', name: 'Product 1' }],
  },
];

export const handlers = [
  // Mock para listar productos (admin)
  http.get('/api/admin/products', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Producto Test 1',
          slug: 'product-test-1',
          price: 100,
          stock: 10,
          categoryId: 'cat1',
          images: [],
          tags: [],
          status: 'active',
          rating: 4.5,
          reviewCount: 5,
          inStock: true,
          features: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    });
  }),

  // Mock para crear producto
  http.post('/api/admin/products', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        id: 'new-id',
        ...body,
        slug: 'new-product-slug',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
  }),

  // Mock para crear categoría
  http.post('/api/admin/categories', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: { id: 'new-cat', ...body, slug: 'new-cat', itemCount: 0 }
    });
  }),

  http.get('*/api/collections', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.has('invalid')) {
      return HttpResponse.json({ message: 'Invalid query parameters' }, { status: 400 });
    }
    return HttpResponse.json(collections);
  }),

  http.get('*/api/collections/position/:position', ({ params }) => {
    const position = params.position as string;
    if (position !== 'home' && position !== 'category') {
      return HttpResponse.json({ message: 'Invalid position' }, { status: 400 });
    }
    return HttpResponse.json(collections.filter((item) => item.displayPosition === position));
  }),

  http.get('*/api/collections/:slug', ({ params }) => {
    const slug = params.slug as string;
    const match = collections.find((item) => item.slug === slug);
    if (!match) {
      return HttpResponse.json({ message: 'Collection not found' }, { status: 404 });
    }
    return HttpResponse.json(match);
  }),

  http.get('*/api/promotions/active', () => {
    return HttpResponse.json(activePromotions);
  }),

  http.get('*/api/promotions/discounts/active', () => {
    return HttpResponse.json(activeDiscounts);
  }),

  http.get('*/api/promotions/product-discount/:productId', ({ params, request }) => {
    const url = new URL(request.url);
    const priceParam = url.searchParams.get('price');
    if (!priceParam) {
      return HttpResponse.json({ message: 'Missing price' }, { status: 400 });
    }

    const price = Number(priceParam);
    if (!Number.isFinite(price)) {
      return HttpResponse.json({ message: 'Invalid price' }, { status: 400 });
    }

    if (params.productId === 'non-existent-product-999') {
      return HttpResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const discountPercentage = 20;
    const discountAmount = Math.round(price * (discountPercentage / 100) * 100) / 100;
    const finalPrice = Math.max(price - discountAmount, 0);

    return HttpResponse.json({
      promotionId: 'promo1',
      originalPrice: price,
      discountAmount,
      finalPrice,
      discountPercentage,
    });
  }),
];
