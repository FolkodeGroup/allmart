import { describe, it, expect } from 'vitest';
import * as productImagesService from '../productImagesService';
import { server } from '../../test/setup';
import { http, HttpResponse } from 'msw';

describe('productImagesService', () => {
  const mockToken = 'test-token-images';
  const productId = 'p1';

  it('fetchImagesByProduct should return product images', async () => {
    server.use(
      http.get('/api/admin/products/:productId/images', () => {
        return HttpResponse.json({
          success: true,
          data: [
            { id: 'i1', productId: 'p1', url: '/img1.webp', position: 1, createdAt: '', updatedAt: '' }
          ]
        });
      })
    );

    const images = await productImagesService.fetchImagesByProduct(mockToken, productId);
    expect(images).toHaveLength(1);
    expect(images[0].url).toBe('/img1.webp');
  });

  it('uploadProductImage should send FormData and return new image', async () => {
    server.use(
      http.post('/api/admin/products/:productId/images/upload', async ({ request }) => {
        const data = await request.formData();
        /* const file = data.get('image') as File; */
        const altText = data.get('altText');
        
        return HttpResponse.json({
          success: true,
          data: {
            id: 'new-img',
            productId: 'p1',
            url: '/new-img.webp',
            altText: altText,
            position: 0,
            originalFilename: 'test.png',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        });
      })
    );

    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const result = await productImagesService.uploadProductImage(mockToken, productId, mockFile, 'My Alt');
    
    expect(result.id).toBe('new-img');
    expect(result.originalFilename).toBe('test.png');
    expect(result.altText).toBe('My Alt');
  });

  it('deleteProductImage should call delete endpoint', async () => {
    let deletedImageId = '';
    server.use(
      http.delete('/api/admin/products/:productId/images/:id', ({ params }) => {
        deletedImageId = params.id as string;
        return HttpResponse.json({ success: true, data: null });
      })
    );

    await productImagesService.deleteProductImage(mockToken, productId, 'i1');
    expect(deletedImageId).toBe('i1');
  });
});
