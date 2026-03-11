import { http, HttpResponse } from 'msw';

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

    const body = await request.json() as any;
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
    const body = await request.json() as any;
    return HttpResponse.json({
      success: true,
      data: { id: 'new-cat', ...body, slug: 'new-cat', itemCount: 0 }
    });
  }),
];
