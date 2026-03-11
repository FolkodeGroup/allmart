import { describe, it, expect, vi } from 'vitest';
import * as productsService from '../productsService';
import { server } from '../../test/setup';
import { http, HttpResponse } from 'msw';

describe('productsService', () => {
  const mockToken = 'test-token-123';

  it('fetchAdminProducts should return products when authorized', async () => {
    const products = await productsService.fetchAdminProducts(mockToken);
    
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Producto Test 1');
  });

  it('fetchAdminProducts should throw error when 401 Unauthorized', async () => {
    // Override manual del handler para este test específico
    server.use(
      http.get('/api/admin/products', () => {
        return new HttpResponse(JSON.stringify({ message: 'No autorizado' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );

    // spy para window.dispatchEvent (el manejador 401 dispara este evento)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    await expect(productsService.fetchAdminProducts(mockToken)).rejects.toThrow('No autorizado');
    
    // Verificamos que se haya disparado el evento unauthorized para cerrar la sesión
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(dispatchSpy.mock.calls[0][0].type).toBe('unauthorized');
  });

  it('createAdminProduct should send correct data and return new product', async () => {
    const newProduct = {
      name: 'Nuevo Producto',
      price: 150,
      categoryId: 'cat1',
      description: 'Desc',
      images: [],
      tags: [],
      inStock: true,
      stock: 5,
    };

    const result = await productsService.createAdminProduct(newProduct as any, mockToken);
    
    expect(result.name).toBe('Nuevo Producto');
    expect(result.id).toBe('new-id');
    expect(result.price).toBe(150);
  });
});
