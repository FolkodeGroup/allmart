import { generateCatalogPdf } from '../services/catalogPdfService';

function buildSampleImageDataUri(label: string, background: string, accent: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500" role="img" aria-label="${label}">
      <rect width="500" height="500" rx="42" fill="${background}" />
      <circle cx="154" cy="148" r="58" fill="${accent}" opacity="0.92" />
      <path d="M72 372l108-120 74 78 70-58 104 100H72z" fill="#769282" opacity="0.95" />
      <text x="250" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#1A1A1A">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function main(): Promise<void> {
  const outputPath = `${process.cwd()}/test-results/catalogo-allmart-sample.pdf`;

  const sampleProducts = [
    {
      id: 'p-001',
      title: 'Camiseta clasica Allmart',
      price: 19999,
      currency: 'ARS',
      shortDescription: 'Camiseta de algodon peinado con corte recto y textura suave para uso diario.',
      imageUrl: buildSampleImageDataUri('Camiseta', '#F2EFEB', '#DDB08C'),
    },
    {
      id: 'p-002',
      title: 'Set de cocina de 5 piezas',
      price: 45999,
      currency: 'ARS',
      shortDescription: 'Juego de cocina con mango siliconado, acabado mate y presentacion lista para regalo.',
      imageUrl: buildSampleImageDataUri('Cocina', '#F9F7F4', '#8fa99a'),
    },
    {
      id: 'p-003',
      title: 'Organizador modular para bano',
      price: 28999,
      currency: 'ARS',
      shortDescription: 'Modulo compacto con divisiones internas y acabado resistente a humedad para uso intensivo.',
      imageUrl: buildSampleImageDataUri('Orden', '#FFFFFF', '#c89a70'),
    },
  ];

  const result = await generateCatalogPdf({
    products: sampleProducts,
    paperFormat: 'A4',
    columns: 2,
    title: 'Catalogo Allmart',
    subtitle: 'Muestra automatizada para validar la exportacion PDF del catalogo.',
    contactText: 'Contacto Allmart | Catalogo para clientes',
    defaultCurrency: 'ARS',
    savePath: outputPath,
  });

  console.log(JSON.stringify({
    fileName: result.fileName,
    outputPath,
    bytes: result.buffer.length,
    products: sampleProducts.length,
  }, null, 2));
}

main().catch((error) => {
  console.error('No se pudo generar el PDF de muestra.', error);
  process.exitCode = 1;
});