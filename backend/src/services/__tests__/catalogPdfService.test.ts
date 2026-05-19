import { describe, expect, it } from 'vitest';
import {
  buildCatalogFileName,
  buildCatalogHtml,
  normalizeCatalogProduct,
  truncateText,
} from '../catalogPdfService';

describe('catalogPdfService', () => {
  it('truncates long text with ellipsis', () => {
    const value = 'A'.repeat(90);
    expect(truncateText(value, 80)).toHaveLength(80);
    expect(truncateText(value, 80).endsWith('...')).toBe(true);
  });

  it('normalizes product payload using fallback fields', () => {
    const product = normalizeCatalogProduct({
      id: 'p-001',
      name: 'Cafetera italiana premium con filtro y mango ergonomico extralargo para cocina moderna',
      price: '19999.5',
      shortDescription: 'Descripcion breve '.repeat(30),
      images: ['/api/images/products/p-001'],
    });

    expect(product.id).toBe('p-001');
    expect(product.title.endsWith('...')).toBe(true);
    expect(product.shortDescription.endsWith('...')).toBe(true);
    expect(product.imageUrl).toBe('/api/images/products/p-001');
    expect(product.formattedPrice).toContain('19');
  });

  it('renders branded html in table format', () => {
    const html = buildCatalogHtml({
      columns: 3,
      title: 'Catalogo Mayorista',
      subtitle: 'PDF listo para compartir con clientes.',
      products: [
        {
          ...normalizeCatalogProduct({
            title: 'Juego de sartenes & utensilios',
            price: 25999,
            currency: 'ARS',
            shortDescription: 'Set con antiadherente y mango siliconado.',
            imageUrl: 'https://example.com/image.jpg',
          }),
          imageDataUri: 'data:image/svg+xml;base64,PHN2Zy8+',
        },
      ],
    });

    expect(html).toContain('class="catalog-table"');
    expect(html).toContain('<th>Imagen</th>');
    expect(html).toContain('<th>Descripcion</th>');
    expect(html).toContain('Catalogo Mayorista');
    expect(html).toContain('Juego de sartenes &amp; utensilios');
    expect(html).toContain('PDF listo para compartir con clientes.');
  });

  it('builds the expected file name', () => {
    expect(buildCatalogFileName(new Date('2026-05-18T10:00:00.000Z'))).toBe('catalogo_allmart_20260518.pdf');
  });
});