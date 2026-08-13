import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('ProductListPage dropdown integration', () => {
    it('uses the shared Dropdown control for the public product sort selector', () => {
        const source = readFileSync(
            join(process.cwd(), 'src/pages/ProductList/ProductListPage.tsx'),
            'utf8'
        );

        expect(source).toContain('Dropdown');
        expect(source).toContain('<Dropdown');
    });
});
