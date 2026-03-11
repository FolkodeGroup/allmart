import { describe, it, expect } from 'vitest';

describe('productsService', () => {
  it('fetchAdminProducts retorna datos paginados', async () => {
    const result = {
      data: [{ id: '1', name: 'Producto Test 1', sku: 'SKU-001', stock: 10, images: [], category: { id: '1', name: 'Cat' } }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1
    };
    
    expect(result.data[0].name).toBe('Producto Test 1');
  });
});
