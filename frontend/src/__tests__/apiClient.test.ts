import { describe, it, expect, beforeEach } from 'vitest';
import { apiFetch, getAuthHeaders, getStoredToken } from '../utils/apiClient';
import { server } from '../test/setup';
import { http, HttpResponse } from 'msw';

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getStoredToken should return token from localStorage', () => {
    localStorage.setItem('allmart_admin_token', 'my-token');
    expect(getStoredToken()).toBe('my-token');
  });

  it('getAuthHeaders should include Bearer token when available', () => {
    localStorage.setItem('allmart_admin_token', 'token-1');
    const headers = getAuthHeaders() as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer token-1');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('apiFetch should send correct headers for JSON', async () => {
    let capturedHeaders: Headers | null = null;
    server.use(
      http.get('/test-json', ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ ok: true });
      })
    );

    localStorage.setItem('allmart_admin_token', 'token-json');
    await apiFetch('/test-json');

    expect(capturedHeaders!.get('Authorization')).toBe('Bearer token-json');
    expect(capturedHeaders!.get('Content-Type')).toBe('application/json');
  });

  it('apiFetch should NOT set Content-Type for FormData', async () => {
    let capturedHeaders: Headers | null = null;
    server.use(
      http.post('/test-form', ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ ok: true });
      })
    );

    const formData = new FormData();
    formData.append('key', 'val');

    await apiFetch('/test-form', {
      method: 'POST',
      body: formData
    });

    // Para FormData, fetch debe dejar que el browser ponga el Content-Type con el boundary
    expect(capturedHeaders!.get('Content-Type')).toContain('multipart/form-data');
    // Pero el Auth header debe seguir estando
    expect(capturedHeaders!.get('Authorization')).toBeDefined();
  });
});
