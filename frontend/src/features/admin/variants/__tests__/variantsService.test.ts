import { describe, it, expect } from 'vitest';
import * as variantsService from '../variantsService';
import { server } from '../../../../test/setup';
import { http, HttpResponse } from 'msw';

describe('variantsService', () => {
  const mockToken = 'test-token-variants';
  const productId = 'p1';

  it('fetchVariantsByProduct should return product variants', async () => {
    server.use(
      http.get('/api/admin/products/:productId/variants', () => {
        return HttpResponse.json({
          success: true,
          data: [
            { id: 'v1', productId: 'p1', name: 'Color', values: ['Red', 'Blue'], createdAt: '', updatedAt: '' }
          ]
        });
      })
    );

    const variants = await variantsService.fetchVariantsByProduct(mockToken, productId);
    expect(variants).toHaveLength(1);
    expect(variants[0].name).toBe('Color');
    expect(variants[0].values).toContain('Blue');
  });

  it('createVariant should create a new variant group', async () => {
    server.use(
      http.post('/api/admin/products/:productId/variants', async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
          success: true,
          data: { id: 'new-v', productId: 'p1', ...body, createdAt: '', updatedAt: '' }
        });
      })
    );

    const result = await variantsService.createVariant(mockToken, productId, { name: 'Size', values: ['S', 'M'] });
    expect(result.id).toBe('new-v');
    expect(result.name).toBe('Size');
  });

  it('deleteVariant should delete variant group', async () => {
    let deletedVariantId = '';
    server.use(
      http.delete('/api/admin/products/:productId/variants/:id', ({ params }) => {
        deletedVariantId = params.id as string;
        return HttpResponse.json({ success: true, data: null });
      })
    );

    await variantsService.deleteVariant(mockToken, productId, 'v1');
    expect(deletedVariantId).toBe('v1');
  });
});
