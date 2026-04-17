/**
 * seed_local_images.ts
 * Crea productos + sube imágenes locales a product_images_storage (binario WebP)
 * y elimina los archivos locales al terminar.
 *
 * Uso: cd backend && npx ts-node-dev --transpile-only src/scripts/seed_local_images.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { prisma } from '../config/prisma';

const ASSETS_DIR = path.resolve(__dirname, '../../../frontend/src/assets/images/products');
const MAX_WIDTH   = 1200;
const THUMB_WIDTH = 300;
const WEBP_QUALITY = 85;

const CAT_COCINA = '53a1e661-b0e3-418f-a727-e5a04968078a';
const CAT_BANO   = '13ea2212-6c85-4d5f-803d-986b62d6a9a1';

interface ProductDef {
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  categoryId: string;
  images: string[];
  features: string[];
  tags: string[];
}

const PRODUCTS: ProductDef[] = [
  {
    name: 'Batería Granito Hudson Gris Oscuro',
    slug: 'bateria-granito-hudson-gris-oscuro',
    sku: 'AM-BCH-GOSC',
    description: 'Batería de cocina antiadherente granito Hudson en gris oscuro. Incluye cacerola, sartén y tapa de vidrio. Libre de PFOA, compatible con todo tipo de hornallas incluyendo inducción.',
    price: 34990, originalPrice: 42990, stock: 15, categoryId: CAT_COCINA,
    images: ['cocina/bateria-ganito-hudson-gris-oscuro.png'],
    features: ['Revestimiento granito antiadherente', 'Compatible con inducción', 'Libre de PFOA', 'Incluye tapa de vidrio'],
    tags: ['cocina', 'bateria', 'granito', 'antiadherente'],
  },
  {
    name: 'Batería Granito Hudson Clara',
    slug: 'bateria-hudson-granito-claro',
    sku: 'AM-BCH-CLAR',
    description: 'Batería de cocina antiadherente granito Hudson en tono claro. Diseño moderno y elegante. Compatible con todo tipo de cocinas incluyendo inducción.',
    price: 32990, originalPrice: 39990, stock: 12, categoryId: CAT_COCINA,
    images: ['cocina/bateria-hudson-granito-claro.png', 'cocina/set-granito-hudson-gris-olla-sarten-otros.png', 'cocina/tapa-hudson.png'],
    features: ['Revestimiento granito antiadherente', 'Compatible con inducción', 'Libre de PFOA'],
    tags: ['cocina', 'bateria', 'granito'],
  },
  {
    name: 'Batería Granito Hudson Negra',
    slug: 'bateria-hudson-negra',
    sku: 'AM-BCH-NEG',
    description: 'Batería de cocina antiadherente granito Hudson en negro. El clásico que nunca falla. Alta durabilidad y fácil limpieza.',
    price: 31990, originalPrice: 38990, stock: 20, categoryId: CAT_COCINA,
    images: ['cocina/bateria-hudson-negra.png'],
    features: ['Revestimiento granito antiadherente', 'Compatible con inducción', 'Alta durabilidad'],
    tags: ['cocina', 'bateria', 'granito', 'negro'],
  },
  {
    name: 'Batería Granito Hudson Verde',
    slug: 'bateria-hudson-verde',
    sku: 'AM-BCH-VERD',
    description: 'Batería de cocina antiadherente granito Hudson en verde. Color tendencia para darle vida a tu cocina.',
    price: 33490, originalPrice: 40990, stock: 8, categoryId: CAT_COCINA,
    images: ['cocina/bateria-hudson-verde.png'],
    features: ['Revestimiento granito antiadherente', 'Compatible con inducción', 'Color tendencia'],
    tags: ['cocina', 'bateria', 'granito', 'verde'],
  },
  {
    name: 'Batería de Cocina París Negra',
    slug: 'bateria-paris-negra',
    sku: 'AM-BCP-NEG',
    description: 'Batería de cocina París en negro mate. Diseño sofisticado con acabado premium. Antiadherente de larga duración.',
    price: 29990, originalPrice: 36990, stock: 18, categoryId: CAT_COCINA,
    images: ['cocina/bateria-paris-negra.png', 'cocina/sarten-olla-y-pimentero.png'],
    features: ['Antiadherente premium', 'Asas ergonómicas', 'Apto lavavajillas'],
    tags: ['cocina', 'bateria', 'paris', 'negro'],
  },
  {
    name: 'Set 24 Cubiertos Carol Acero Inoxidable',
    slug: 'set-24-cubiertos-carol',
    sku: 'AM-SC24-CAROL',
    description: 'Set de 24 cubiertos Carol de acero inoxidable 18/10. Incluye 6 cucharas, 6 tenedores, 6 cuchillos y 6 cucharitas. Resistente a la corrosión.',
    price: 8990, originalPrice: 12990, stock: 25, categoryId: CAT_COCINA,
    images: ['cocina/set-24-cubiertos-carol.png', 'cocina/set-cubierto-acero-carol.png', 'cocina/set-cubiertos-carol-grises.png'],
    features: ['Acero inoxidable 18/10', '24 piezas', 'Resistente a la corrosión', 'Apto lavavajillas'],
    tags: ['cubiertos', 'acero', 'carol'],
  },
  {
    name: 'Set Cubiertos Acero Inoxidable Negro',
    slug: 'set-cubierto-acero-negro',
    sku: 'AM-SC-NEG',
    description: 'Elegante set de cubiertos en acero inoxidable con acabado negro mate. Diseño moderno para mesas sofisticadas.',
    price: 10990, originalPrice: 14990, stock: 15, categoryId: CAT_COCINA,
    images: ['cocina/set-cubierto-acero-negro.png'],
    features: ['Acabado negro mate', 'Acero inoxidable', 'Diseño moderno'],
    tags: ['cubiertos', 'acero', 'negro'],
  },
  {
    name: 'Set Cubiertos Jumbo Acero',
    slug: 'set-cubierto-jumbo',
    sku: 'AM-SCJ-ACERO',
    description: 'Set de cubiertos Jumbo en acero inoxidable de calibre extra. Ideal para el uso diario y grandes comidas.',
    price: 12490, stock: 10, categoryId: CAT_COCINA,
    images: ['cocina/set-cubierto-jumbo.png'],
    features: ['Calibre extra grueso', 'Acero inoxidable premium'],
    tags: ['cubiertos', 'jumbo', 'acero'],
  },
  {
    name: 'Set de Cubiertos Completo',
    slug: 'set-cubiertos',
    sku: 'AM-SC-COMP',
    description: 'Set de cubiertos completo para toda la familia. Terminación brillante y elegante.',
    price: 7490, stock: 30, categoryId: CAT_COCINA,
    images: ['cocina/set-cubierto.png'],
    features: ['Set completo', 'Terminación brillante'],
    tags: ['cubiertos', 'set'],
  },
  {
    name: 'Set de Sartenes Antiadherente Blanco',
    slug: 'set-sarten-blanco',
    sku: 'AM-SSB-BLCO',
    description: 'Set de sartenes antiadherente en color blanco. Incluye 3 sartenes de distintos tamaños (20, 24 y 28 cm). Libre de PFOA.',
    price: 18990, originalPrice: 24990, stock: 14, categoryId: CAT_COCINA,
    images: ['cocina/set-sarten-blanco.png'],
    features: ['3 tamaños incluidos (20/24/28 cm)', 'Antiadherente premium', 'Libre de PFOA'],
    tags: ['sarten', 'blanco', 'antiadherente'],
  },
  {
    name: 'Set de Asado Completo',
    slug: 'set-asado-completo',
    sku: 'AM-SASADO-COMP',
    description: 'Set completo para asado argentino. Incluye tenazas, pinzas, cuchillo y tenedor. Acero inoxidable resistente al calor.',
    price: 15990, originalPrice: 19990, stock: 20, categoryId: CAT_COCINA,
    images: ['cocina/set-asado.png', 'cocina/set-asado-fondo-azul.png', 'cocina/tenedor-y-cuchillo-con-carne.png', 'cocina/tenedor-y-cuchillo.png'],
    features: ['Set completo de asado', 'Acero inoxidable', 'Resistente al calor'],
    tags: ['asado', 'parrilla', 'carne'],
  },
  {
    name: 'Pinza de Cocina Silicona Gris',
    slug: 'pinza-gris-silicona',
    sku: 'AM-PINZ-GRIS',
    description: 'Pinza de cocina en silicona resistente al calor hasta 230°C. No raya superficies antiadherentes.',
    price: 1290, stock: 50, categoryId: CAT_COCINA,
    images: ['cocina/pinza-gris-silicona.png'],
    features: ['Resistente hasta 230°C', 'No raya antiadherente', 'Bloqueo de seguridad'],
    tags: ['pinza', 'silicona', 'gris'],
  },
  {
    name: 'Pinza de Cocina Silicona Negra',
    slug: 'pinza-negra-silicona',
    sku: 'AM-PINZ-NEG',
    description: 'Pinza de cocina en silicona resistente al calor hasta 230°C. No raya superficies antiadherentes.',
    price: 1290, stock: 50, categoryId: CAT_COCINA,
    images: ['cocina/pinza-negra-silicona.png'],
    features: ['Resistente hasta 230°C', 'No raya antiadherente', 'Bloqueo de seguridad'],
    tags: ['pinza', 'silicona', 'negro'],
  },
  {
    name: 'Especieros de Cocina',
    slug: 'especieros',
    sku: 'AM-ESPEC-SET',
    description: 'Set de especieros para organizar tu cocina. Diseño moderno y funcional con tapa hermética.',
    price: 4990, stock: 35, categoryId: CAT_COCINA,
    images: ['cocina/especieros.png'],
    features: ['Tapa hermética', 'Vidrio y acero inoxidable', 'Diseño moderno'],
    tags: ['especieros', 'cocina', 'organizador'],
  },
  {
    name: 'Canastos Organizadores',
    slug: 'canastos-organizadores',
    sku: 'AM-CANAST-ORG',
    description: 'Set de canastos organizadores para cocina. Ideal para frutas, verduras o almacenamiento general.',
    price: 5990, stock: 25, categoryId: CAT_COCINA,
    images: ['cocina/canastos.png'],
    features: ['Set de canastos', 'Multifuncional', 'Material resistente'],
    tags: ['canasto', 'organizador', 'cocina'],
  },
  {
    name: 'Botella de Agua Acero Inoxidable',
    slug: 'botella-acero-inoxidable',
    sku: 'AM-BOT-ACERO',
    description: 'Botella de agua en acero inoxidable con doble pared. Mantiene frío 24hs y caliente 12hs. Libre de BPA.',
    price: 3490, stock: 40, categoryId: CAT_COCINA,
    images: ['cocina/botella.png'],
    features: ['Doble pared térmica', 'Frío 24hs / Calor 12hs', 'Libre de BPA'],
    tags: ['botella', 'termica', 'acero'],
  },
  {
    name: 'Lata de Café Hermética',
    slug: 'lata-cafe-hermetica',
    sku: 'AM-LATA-CAFE',
    description: 'Lata hermética para almacenamiento de café molido o en grano. Conserva el aroma y frescura.',
    price: 2990, stock: 30, categoryId: CAT_COCINA,
    images: ['cocina/lata-cafe.png'],
    features: ['Cierre hermético', 'Conserva aroma y frescura', 'Diseño decorativo'],
    tags: ['cafe', 'lata', 'hermetico'],
  },
  {
    name: 'Vasos de Vidrio Set x6',
    slug: 'vasos-vidrio-set',
    sku: 'AM-VASOS-VID6',
    description: 'Set de 6 vasos de vidrio templado. Diseño clásico y resistente. Apto lavavajillas.',
    price: 5490, stock: 22, categoryId: CAT_COCINA,
    images: ['cocina/vasos.png'],
    features: ['Set x6 vasos', 'Vidrio templado', 'Apto lavavajillas'],
    tags: ['vasos', 'vidrio', 'set'],
  },
  {
    name: 'Cafetera Italiana Moka',
    slug: 'cafetera-italiana',
    sku: 'AM-CAFE-ITAL',
    description: 'Cafetera italiana moka de aluminio. Para preparar el mejor café espresso en casa. Diseño clásico italiano.',
    price: 7990, originalPrice: 9990, stock: 28, categoryId: CAT_COCINA,
    images: ['cocina/cafetera.png'],
    features: ['Aluminio de alta calidad', 'Café estilo espresso', 'Para gas o eléctrica'],
    tags: ['cafetera', 'italiana', 'cafe', 'espresso'],
  },
  // ── BAÑO
  {
    name: 'Set de Accesorios de Baño Blanco',
    slug: 'set-bano-blanco',
    sku: 'AM-SBB-BLCO',
    description: 'Set de accesorios de baño en color blanco. Incluye dispensador de jabón, vaso, jabonera y portacepillos. Diseño minimalista.',
    price: 6990, originalPrice: 8990, stock: 20, categoryId: CAT_BANO,
    images: ['baño/set-de-baño-blanco.png'],
    features: ['4 piezas incluidas', 'Diseño minimalista', 'Fácil limpieza'],
    tags: ['bano', 'accesorios', 'blanco'],
  },
  {
    name: 'Tacho de Baño Blanco Cuadrado',
    slug: 'tacho-bano-blanco-cuadrado',
    sku: 'AM-TACH-BCUAD',
    description: 'Tacho de residuos para baño en blanco con forma cuadrada. Apertura a pedal, capacidad 5 litros.',
    price: 3490, stock: 35, categoryId: CAT_BANO,
    images: ['baño/tacho-blanco-cuadrado.png'],
    features: ['Apertura a pedal', 'Capacidad 5 litros', 'Diseño cuadrado'],
    tags: ['tacho', 'bano', 'blanco'],
  },
  {
    name: 'Tacho de Baño Blanco Redondo',
    slug: 'tacho-bano-blanco-redondo',
    sku: 'AM-TACH-BRED',
    description: 'Tacho de residuos para baño en blanco con forma redonda. Apertura a pedal, capacidad 5 litros.',
    price: 3290, stock: 35, categoryId: CAT_BANO,
    images: ['baño/tacho-blanco-redondo.png'],
    features: ['Apertura a pedal', 'Capacidad 5 litros', 'Diseño redondo'],
    tags: ['tacho', 'bano', 'blanco'],
  },
];

// ─── Procesamiento de imágenes ────────────────────────────────────────────────

async function processImageToWebp(filePath: string) {
  const data = await sharp(filePath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const thumb = await sharp(filePath)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  const fullMeta  = await sharp(data).metadata();
  const thumbMeta = await sharp(thumb).metadata();

  return {
    data,
    thumb,
    width:       fullMeta.width  ?? 800,
    height:      fullMeta.height ?? 600,
    thumbWidth:  thumbMeta.width  ?? THUMB_WIDTH,
    thumbHeight: thumbMeta.height ?? 200,
    sizeBytes:   data.length,
  };
}

// ─── Crear / obtener producto ─────────────────────────────────────────────────

async function ensureProduct(p: ProductDef): Promise<string> {
  const existing = await (prisma as any).product.findFirst({ where: { sku: p.sku } });
  if (existing) {
    console.log(`  ⚠️  Ya existe: ${p.name} (${p.sku})`);
    return existing.id as string;
  }

  const product = await (prisma as any).product.create({
    data: {
      name:          p.name,
      slug:          p.slug,
      sku:           p.sku,
      description:   p.description,
      price:         p.price,
      originalPrice: p.originalPrice ?? null,
      stock:         p.stock,
      status:        'active',
      categoryId:    p.categoryId,
      images:        [],
      features:      p.features,
      tags:          p.tags,
      inStock:       p.stock > 0,
    },
  });

  // Vincular categoría en product_categories
  try {
    await (prisma as any).productCategory.create({
      data: { productId: product.id, categoryId: p.categoryId },
    });
  } catch (_) { /* ya existe */ }

  console.log(`  ✅ Creado: ${p.name} → ${product.id}`);
  return product.id as string;
}

// ─── Subir imagen a DB ────────────────────────────────────────────────────────

async function uploadImage(productId: string, imgRelPath: string, position: number): Promise<boolean> {
  const fullPath = path.join(ASSETS_DIR, imgRelPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`    ❌ No encontrada: ${fullPath}`);
    return false;
  }

  try {
    const { data, thumb, width, height, thumbWidth, thumbHeight, sizeBytes } =
      await processImageToWebp(fullPath);

    await (prisma as any).productImageStorage.create({
      data: {
        productId,
        data,
        width,
        height,
        thumbnail:       thumb,
        thumbWidth,
        thumbHeight,
        mimeType:        'image/webp',
        originalFilename: path.basename(imgRelPath),
        sizeBytes,
        position,
      },
    });

    console.log(`    📷 ${path.basename(imgRelPath)} → ${(sizeBytes / 1024).toFixed(0)}KB WebP`);
    return true;
  } catch (err: any) {
    console.log(`    ❌ Error subiendo ${path.basename(imgRelPath)}: ${err.message}`);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Cargando productos e imágenes locales...\n');

  const deletePaths: string[] = [];
  let totalProducts = 0;
  let totalImages   = 0;

  for (const p of PRODUCTS) {
    console.log(`\n📦 ${p.name}`);
    const productId = await ensureProduct(p);
    totalProducts++;

    // Limpiar imágenes anteriores en storage
    await (prisma as any).productImageStorage.deleteMany({ where: { productId } });

    for (let i = 0; i < p.images.length; i++) {
      const ok = await uploadImage(productId, p.images[i], i);
      if (ok) {
        totalImages++;
        const abs = path.join(ASSETS_DIR, p.images[i]);
        if (!deletePaths.includes(abs)) deletePaths.push(abs);
      }
    }

    // Actualizar images[] del producto con las URLs de la DB
    const stored = await (prisma as any).productImageStorage.findMany({
      where:   { productId },
      orderBy: { position: 'asc' },
      select:  { id: true },
    });
    await (prisma as any).product.update({
      where: { id: productId },
      data:  { images: stored.map((s: any) => `/api/images/products/${s.id}`) },
    });
  }

  console.log(`\n\n✅ Resumen:`);
  console.log(`   Productos: ${totalProducts}`);
  console.log(`   Imágenes:  ${totalImages}`);

  // Eliminar archivos locales
  if (deletePaths.length > 0) {
    console.log(`\n🗑️  Eliminando ${deletePaths.length} archivos locales...`);
    let deleted = 0;
    for (const f of deletePaths) {
      try { fs.unlinkSync(f); deleted++; }
      catch (e: any) { console.log(`   ⚠️  ${path.basename(f)}: ${e.message}`); }
    }

    // Intentar eliminar dirs vacíos
    for (const dir of ['cocina', 'baño']) {
      const d = path.join(ASSETS_DIR, dir);
      if (fs.existsSync(d)) {
        const rem = fs.readdirSync(d);
        if (rem.length === 0) {
          fs.rmdirSync(d);
          console.log(`   📁 Carpeta eliminada: ${dir}/`);
        } else {
          console.log(`   ⚠️  Quedan en ${dir}/: ${rem.join(', ')}`);
        }
      }
    }
    console.log(`   ✅ ${deleted} archivos eliminados`);
  }

  await (prisma as any).$disconnect();
  console.log('\n🎉 ¡Completado!\n');
}

main().catch(async (err) => {
  console.error('\n❌ Error:', err.message || err);
  await (prisma as any).$disconnect();
  process.exit(1);
});
