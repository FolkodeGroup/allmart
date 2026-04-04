import { describe, expect, it } from 'vitest';
import { normalizeImageUrl } from '../imageUrl';

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
});
