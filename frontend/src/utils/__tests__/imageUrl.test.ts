import { describe, expect, it } from 'vitest';
import { normalizeImageUrl, toThumbnailImageUrl } from '../imageUrl';

describe('normalizeImageUrl', () => {
  it('returns trimmed string urls', () => {
    expect(normalizeImageUrl(' https://example.com/a.jpg ')).toBe('https://example.com/a.jpg');
  });

  it('extracts urls from legacy objects', () => {
    expect(normalizeImageUrl({ url: 'https://example.com/legacy.jpg' })).toBe(
      'https://example.com/legacy.jpg'
    );
  });

  it('returns undefined for empty or invalid values', () => {
    expect(normalizeImageUrl('   ')).toBeUndefined();
    expect(normalizeImageUrl({})).toBeUndefined();
    expect(normalizeImageUrl({ url: 123 })).toBeUndefined();
    expect(normalizeImageUrl(null)).toBeUndefined();
  });

  it('converts backend image urls to thumbnail variants', () => {
    expect(toThumbnailImageUrl('/api/images/products/abc123')).toBe('/api/images/products/abc123/thumb');
    expect(toThumbnailImageUrl('/api/images/banners/xyz789')).toBe('/api/images/banners/xyz789/thumb');
    expect(toThumbnailImageUrl('https://example.com/cdn/image.webp')).toBe('https://example.com/cdn/image.webp');
  });
});
