import { describe, it, expect } from 'vitest';
import * as categoriesService from '../categoriesService';
import { server } from '../../test/setup';
import { http, HttpResponse } from 'msw';

describe('categoriesService', () => {
  const mockToken = 'test-token-categories';

  it('fetchAdminCategories should return categories', async () => {
    server.use(
      http.get('/api/admin/categories', () => {
        return HttpResponse.json({
          success: true,
          data: [
            { id: 'c1', name: 'Cat 1', slug: 'cat-1', itemCount: 5 }
          ]
        });
      })
    );

    const categories = await categoriesService.fetchAdminCategories(mockToken);
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('Cat 1');
  });

  it('createAdminCategory should create a new category', async () => {
    const result = await categoriesService.createAdminCategory(mockToken, { name: 'New Cat', slug: 'new-cat' });
    expect(result.id).toBe('new-cat');
    expect(result.name).toBe('New Cat');
  });

  it('deleteAdminCategory should call delete endpoint', async () => {
    let deletedId = '';
    server.use(
      http.delete('/api/admin/categories/:id', ({ params }) => {
        deletedId = params.id as string;
        return HttpResponse.json({ success: true, data: null });
      })
    );

    await categoriesService.deleteAdminCategory(mockToken, 'c1');
    expect(deletedId).toBe('c1');
  });
});
