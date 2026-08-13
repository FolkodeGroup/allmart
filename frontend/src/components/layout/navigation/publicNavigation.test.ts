import { describe, expect, it } from 'vitest';
import { baseNavigation, fallbackNavigation } from './publicNavigation';

describe('publicNavigation', () => {
  it('exposes the direct Featured navigation route from the public navbar base items', () => {
    expect(baseNavigation).toContainEqual({ label: 'Destacado', href: '/productos?tag=destacado' });
  });

  it('keeps the fallback navigation aligned with the public navigation base items', () => {
    expect(fallbackNavigation).toContainEqual({ label: 'Destacado', href: '/productos?tag=destacado' });
  });
});
