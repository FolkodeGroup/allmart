// src/seed_demo.ts

import { prisma } from './config/prisma';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  OrderStatus,
  ProductStatus,
  UserRole,
} from './types/enums';

dotenv.config();

/**
 * Allmart - Robust Demo Seed (CRM + R2 Native)
 * ──────────────────────────────────────────────────────────────────────────────
 * Este script inicializa el ecosistema completo:
 * 1. Usuarios (Admins y CRM Unificado para Clientes).
 * 2. Catálogo (Categorías, Subcategorías y Productos).
 * 3. Almacenamiento (Estructura de llaves para Cloudflare R2 sin binarios).
 * 4. Normalización (Tags y Features relacionales).
 * 5. Transacciones (Pedidos y Status History).
 */

type PrismaOrderStatusInput = Parameters<typeof prisma.orderStatusHistory.create>[0]['data']['status'];

type PersistedProduct = {
  id: string;
  name: string;
  price: number;
  images: string[];
};

interface DemoProductTemplate {
  name: string;
  price: number;
  tags: string[];
}

interface DemoSubcategory {
  name: string;
  slug: string;
  description: string;
  imageSet: ImageSetKey;
  featurePool: FeaturePoolKey;
  products: DemoProductTemplate[];
}

interface DemoCategory {
  name: string;
  slug: string;
  description: string;
  imageSet: ImageSetKey;
  subcategories: DemoSubcategory[];
}

interface GeneratedProduct {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  images: string[];
  categorySlug: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  sku: string;
  features: string[];
}

interface DemoCustomer {
  firstName: string;
  lastName: string;
  email: string;
}

// ─── CONFIGURACIÓN DE IMÁGENES (UNSPLASH) ────────────────────────────────────

const UNSPLASH_PARAMS = 'auto=format&fit=crop&w=600&h=600&q=80';
const unsplash = (photoId: string): string => `https://images.unsplash.com/${photoId}?${UNSPLASH_PARAMS}`;

const IMAGE_SETS = {
  cocina: [
    unsplash('photo-1587300003388-59208cc962cb'),
    unsplash('photo-1590794056226-79ef3a8147e1'),
    unsplash('photo-1593618998160-e34014e67546'),
    unsplash('photo-1416339306562-f3d12fefd36f'),
  ],
  cafeMate: [
    unsplash('photo-1495474472287-4d71bcdd2085'),
    unsplash('photo-1454625233598-f29d597eea1e'),
    unsplash('photo-1495978866932-92dbc079e62e'),
  ],
  cocteleria: [
    unsplash('photo-1510812431401-41d2bd2722f3'),
    unsplash('photo-1479030574009-1e48577746e8'),
    unsplash('photo-1454625233598-f29d597eea1e'),
  ],
  bano: [
    unsplash('photo-1620626011761-996317b8d101'),
    unsplash('photo-1556228578-8c89e6adf883'),
    unsplash('photo-1552321554-5fefe8c9ef14'),
  ],
  reposteria: [
    unsplash('photo-1578985545062-69928b1d9587'),
    unsplash('photo-1587300003388-59208cc962cb'),
  ],
  ferreteria: [
    unsplash('photo-1530124566582-a618bc2615dc'),
    unsplash('photo-1540538581514-1d465aaad58c'),
  ],
  hogar: [
    unsplash('photo-1595428774223-ef52624120d2'),
    unsplash('photo-1610701596007-11502861dcfa'),
  ],
  textiles: [
    unsplash('photo-1566073771259-6a8506099945'),
    unsplash('photo-1556228578-8c89e6adf883'),
  ],
  iluminacion: [
    unsplash('photo-1507473885765-e6ed057f782c'),
    unsplash('photo-1510812431401-41d2bd2722f3'),
  ],
  jardineria: [
    unsplash('photo-1545243424-0ce743321e11'),
    unsplash('photo-1464207687429-7505649dae38'),
  ],
} as const;

type ImageSetKey = keyof typeof IMAGE_SETS;

// ─── POOLS DE CARACTERÍSTICAS ────────────────────────────────────────────────

const FEATURE_POOLS = {
  cocina: [
    'Material de alta resistencia para uso diario',
    'Fácil limpieza y mantenimiento rápido',
    'Diseño ergonómico para mejor agarre',
    'Terminación premium con excelente durabilidad',
    'Compatible con cocinas modernas',
    'Presentación ideal para regalo',
  ],
  cafeMate: [
    'Conserva temperatura y sabor por más tiempo',
    'Componentes resistentes al uso intensivo',
    'Diseño pensado para rituales diarios',
    'Acabado elegante para mesa o escritorio',
    'Fuerte relación precio-calidad',
  ],
  cocteleria: [
    'Acero y vidrio de alta calidad',
    'Formato ideal para reuniones y eventos',
    'Apto para uso doméstico y profesional',
    'Terminaciones pulidas y modernas',
  ],
  bano: [
    'Texturas suaves y acabados prolijos',
    'Resistente a humedad y uso diario',
    'Diseño minimalista para baños modernos',
  ],
  reposteria: [
    'Superficie antiadherente para mejor desmolde',
    'Medidas prácticas para preparaciones caseras',
    'Ideal para principiantes y avanzados',
  ],
  ferreteria: [
    'Construcción robusta para tareas de hogar',
    'Agarre firme y seguro en cada uso',
    'Diseño compacto para guardar fácilmente',
  ],
  hogar: [
    'Ahorra espacio en ambientes reducidos',
    'Diseño funcional para orden diario',
    'Material resistente para uso continuo',
  ],
  textiles: [
    'Tejido suave y agradable al tacto',
    'Colores neutros fáciles de combinar',
    'Confección reforzada para mayor vida util',
  ],
  iluminacion: [
    'Bajo consumo y buena potencia lumínica',
    'Diseño contemporáneo y elegante',
    'Luz confortable para uso cotidiano',
  ],
  jardineria: [
    'Resistente a exterior y cambios climáticos',
    'Formato práctico para mantenimiento diario',
    'Diseño funcional para patios y balcones',
  ],
} as const;

type FeaturePoolKey = keyof typeof FEATURE_POOLS;

// ─── ESTRUCTURA DE DATOS ────────────────────────────────────────────────────

const p = (name: string, price: number, tags: string[]): DemoProductTemplate => ({ name, price, tags });

const sub = (name: string, slug: string, description: string, imageSet: ImageSetKey, featurePool: FeaturePoolKey, products: DemoProductTemplate[]): DemoSubcategory => ({
  name, slug, description, imageSet, featurePool, products,
});

const category = (name: string, slug: string, description: string, imageSet: ImageSetKey, subcategories: DemoSubcategory[]): DemoCategory => ({
  name, slug, description, imageSet, subcategories,
});

const DEMO_CATEGORIES: DemoCategory[] = [
  category('Cocina', 'cocina', 'Equipamiento funcional', 'cocina', [
    sub('Baterias de Cocina', 'baterias-cocina', 'ollas y sartenes', 'cocina', 'cocina', [
      p('Set de Ollas Granito 7 Piezas', 129990, ['oferta', 'bestseller', 'cocina']),
      p('Sarten Profunda Antiadherente 28cm', 46990, ['nuevo', 'cocina']),
    ]),
    sub('Utensilios', 'utensilios', 'accesorios prácticos', 'cocina', 'cocina', [
      p('Set Cuchillos Chef 5 Piezas', 38990, ['premium', 'cocina']),
      p('Espátulas Silicona x6', 15990, ['nuevo', 'cocina']),
    ]),
    sub('Almacenaje', 'almacenaje-cocina', 'orden en la alacena', 'cocina', 'hogar', [
      p('Frascos Herméticos x6', 26990, ['bestseller', 'hogar']),
    ]),
  ]),
  category('Cafe y Mate', 'cafe-mate', 'Rituales diarios', 'cafeMate', [
    sub('Molinillos y Cafeteras', 'molinillos-cafeteras', 'cafe de especialidad', 'cafeMate', 'cafeMate', [
      p('Cafetera Italiana Acero 6 Tazas', 34990, ['oferta', 'cafe']),
    ]),
    sub('Accesorios de Mate', 'accesorios-mate', 'diseño argentino', 'cafeMate', 'cafeMate', [
      p('Termo Acero Inox 1.2L', 48990, ['nuevo', 'mate', 'bestseller']),
      p('Mate de Madera Premium', 21990, ['oferta', 'mate']),
    ]),
  ]),
  category('Reposteria', 'reposteria', 'Repostería creativa', 'reposteria', [
    sub('Moldes y Bandejas', 'moldes-bandejas', 'horneado perfecto', 'reposteria', 'reposteria', [
      p('Moldes Siliconados x8', 22990, ['oferta', 'reposteria']),
    ]),
  ]),
  category('Bano', 'bano', 'Confort en el baño', 'bano', [
    sub('Textiles Bano', 'toallas-textiles', 'toallas suaves', 'bano', 'bano', [
      p('Juego Toallas Algodón x3', 28990, ['bestseller', 'bano']),
    ]),
    sub('Accesorios Bano', 'accesorios-bano', 'sets funcionales', 'bano', 'bano', [
      p('Set Accesorios Bano 4 Piezas', 29990, ['premium', 'bano']),
    ]),
  ]),
  category('Ferreteria', 'ferreteria', 'Herramientas hogar', 'ferreteria', [
    sub('Herramientas Manuales', 'herramientas-manuales', 'kits reparación', 'ferreteria', 'ferreteria', [
      p('Caja Herramientas 45 Piezas', 54990, ['oferta', 'ferreteria']),
    ]),
  ]),
];

const DEMO_CUSTOMERS: DemoCustomer[] = [
  { firstName: 'Lucia', lastName: 'Benitez', email: 'cliente.demo.01@allmart.test' },
  { firstName: 'Martin', lastName: 'Sosa', email: 'cliente.demo.02@allmart.test' },
  { firstName: 'Florencia', lastName: 'Quiroga', email: 'cliente.demo.03@allmart.test' },
  { firstName: 'Diego', lastName: 'Molina', email: 'cliente.demo.04@allmart.test' },
  { firstName: 'Carolina', lastName: 'Ramos', email: 'cliente.demo.05@allmart.test' },
  { firstName: 'Agustin', lastName: 'Castro', email: 'cliente.demo.06@allmart.test' },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function getImages(imageSet: ImageSetKey, seed: number): string[] {
  const set = IMAGE_SETS[imageSet];
  return [0, 1, 2].map((offset) => set[(seed + offset) % set.length]);
}

function pickFeatures(pool: readonly string[], seed: number, amount = 4): string[] {
  const selected: string[] = [];
  for (let i = 0; i < amount; i += 1) {
    selected.push(pool[(seed + i) % pool.length]);
  }
  return Array.from(new Set(selected));
}

function toPrismaOrderStatus(status: OrderStatus): PrismaOrderStatusInput {
  const map: Record<string, string> = {
    [OrderStatus.PENDING]: 'pendiente',
    [OrderStatus.CONFIRMED]: 'confirmado',
    [OrderStatus.PROCESSING]: 'en_preparacion',
    [OrderStatus.SHIPPED]: 'enviado',
    [OrderStatus.DELIVERED]: 'entregado',
    [OrderStatus.CANCELLED]: 'cancelado',
  };
  return map[status] as PrismaOrderStatusInput;
}

function makeRecentDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function buildDemoProducts(categories: DemoCategory[]): GeneratedProduct[] {
  const products: GeneratedProduct[] = [];
  let globalIndex = 1;

  for (const categoryRow of categories) {
    for (const subcategoryRow of categoryRow.subcategories) {
      for (const template of subcategoryRow.products) {
        const slug = slugify(template.name);
        const stock = 10 + ((globalIndex * 13) % 91);
        products.push({
          name: template.name,
          slug,
          shortDescription: `${template.name} pensado para ${subcategoryRow.name.toLowerCase()}.`,
          description: `${template.name} combina materiales durables.`,
          price: template.price,
          images: getImages(subcategoryRow.imageSet, globalIndex),
          categorySlug: subcategoryRow.slug,
          tags: Array.from(new Set(template.tags)),
          rating: 4.8,
          reviewCount: 15,
          inStock: stock > 0,
          stock,
          sku: `ALM-${subcategoryRow.slug.toUpperCase().slice(0,3)}-${String(globalIndex).padStart(4, '0')}`,
          features: pickFeatures(FEATURE_POOLS[subcategoryRow.featurePool], globalIndex),
        });
        globalIndex += 1;
      }
    }
  }
  return products;
}

// ─── SEED FUNCTIONS ─────────────────────────────────────────────────────────

async function seedUsers(): Promise<number> {
  console.log('Sincronizando Usuarios (Admins)...');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const hashedAdmin = await bcrypt.hash(adminPassword, 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: { passwordHash: hashedAdmin, role: UserRole.ADMIN },
    create: { firstName: 'Admin', lastName: 'Principal', email: 'admin@admin.com', passwordHash: hashedAdmin, role: UserRole.ADMIN, isActive: true },
  });

  return 1;
}

async function seedCategoriesAndProducts(products: GeneratedProduct[]) {
  console.log('Sincronizando Catálogo y Storage R2...');
  const catMap = new Map<string, string>();

  for (const c of DEMO_CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, imageUrl: IMAGE_SETS[c.imageSet][0] },
      create: { name: c.name, slug: c.slug, description: c.description, imageUrl: IMAGE_SETS[c.imageSet][0] },
    });
    catMap.set(c.slug, parent.id);

    for (const sc of c.subcategories) {
      const child = await prisma.category.upsert({
        where: { slug: sc.slug },
        update: { name: sc.name },
        create: { name: sc.name, slug: sc.slug, description: sc.description, parentId: parent.id },
      });
      catMap.set(sc.slug, child.id);
    }
  }

  const persistedProducts: PersistedProduct[] = [];
  for (const product of products) {
    const productRow = await prisma.product.upsert({
      where: { sku: product.sku },
      update: { name: product.name, price: product.price, images: product.images, stock: product.stock },
      create: { 
        name: product.name, slug: product.slug, shortDescription: product.shortDescription, 
        description: product.description, price: product.price, images: product.images, 
        stock: product.stock, sku: product.sku, status: ProductStatus.ACTIVE,
        rating: product.rating, reviewCount: product.reviewCount, inStock: product.inStock
      },
    });

    // Vincular Categoría (N:M)
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: productRow.id, categoryId: catMap.get(product.categorySlug)! } },
      update: {}, create: { productId: productRow.id, categoryId: catMap.get(product.categorySlug)! }
    });

    // Normalizar Tags (Relacional)
    for (const tagName of product.tags) {
      const tag = await prisma.tag.upsert({ where: { name: tagName }, update: {}, create: { name: tagName } });
      await prisma.productTag.upsert({
        where: { productId_tagId: { productId: productRow.id, tagId: tag.id } },
        update: {}, create: { productId: productRow.id, tagId: tag.id }
      });
    }

    // Normalizar Features (Relacional)
    await prisma.productFeature.deleteMany({ where: { productId: productRow.id } });
    await prisma.productFeature.createMany({
      data: product.features.map((f, i) => ({ productId: productRow.id, description: f, displayOrder: i }))
    });

    // Fase 4: Registro Storage (Sin BYTEA)
    const timestamp = Date.now();
    await prisma.productImageStorage.deleteMany({ where: { productId: productRow.id } });
    await prisma.productImageStorage.create({
      data: {
        productId: productRow.id,
        storageKey: `products/${productRow.id}/${timestamp}-0.webp`,
        storageThumbKey: `products/${productRow.id}/thumbs/${timestamp}-0.webp`,
        width: 800, height: 800, sizeBytes: 1024, position: 0, mimeType: 'image/webp'
      }
    });

    persistedProducts.push({ id: productRow.id, name: productRow.name, price: Number(productRow.price), images: product.images });
  }

  return persistedProducts;
}

async function seedOrdersAndSales(persistedProducts: PersistedProduct[]) {
  console.log('Generando historial de pedidos (CRM Unificado)...');
  
  for (let i = 0; i < 10; i++) {
    const customer = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
    const product = persistedProducts[i % persistedProducts.length];
    const baseDate = makeRecentDate(i + 1);

    // CRM UPSERT: Comprador demo en tabla User (Fase 5)
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      update: { totalOrders: { increment: 1 }, totalSpent: { increment: product.price } },
      create: { 
        email: customer.email, firstName: customer.firstName, lastName: customer.lastName, 
        role: 'customer', passwordHash: null, totalOrders: 1, totalSpent: product.price 
      }
    });

    await prisma.order.create({
      data: {
        userId: user.id,
        customerFirstName: customer.firstName, customerLastName: customer.lastName,
        customerEmail: customer.email, total: product.price, status: toPrismaOrderStatus(OrderStatus.DELIVERED),
        paymentStatus: 'abonado', notes: 'Pedido demo CRM.',
        createdAt: baseDate, updatedAt: baseDate,
        orderItems: {
          create: { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price, productImage: product.images[0] }
        },
        orderStatusHistory: {
          create: { status: 'entregado', note: 'Pedido completado' }
        }
      }
    });
  }
}

async function seedSuppliers() {
  console.log('Creando proveedores demo...');
  const suppliersData = [
    { name: 'Distribuidora Hogar SA', phone: '+54 11 4321-1234', address: 'Av. Corrientes 1500, CABA', email: 'ventas@hogarsa.test' },
    { name: 'Cocina & Arte SRL', phone: '+54 11 5678-8765', address: 'Bv. Oroño 540, Rosario', email: 'contacto@cocinarte.test' },
    { name: 'Ferrotodo', phone: '+54 11 4000-9988', address: 'Av. San Martín 3200, CABA', email: 'info@ferrotodo.test' }
  ];

  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (existing) {
      await prisma.supplier.update({ where: { id: existing.id }, data: { ...s, products: 'General', isActive: true } });
    } else {
      await prisma.supplier.create({ data: { ...s, products: 'General', isActive: true } });
    }
  }
}

async function runSeed() {
  try {
    console.log('🚀 Iniciando SEED DEMO ROBUSTO...');
    await seedUsers();
    const products = buildDemoProducts(DEMO_CATEGORIES);
    const persisted = await seedCategoriesAndProducts(products);
    await seedOrdersAndSales(persisted);
    await seedSuppliers();
    console.log('=============================================');
    console.log('✅ SEED DEMO COMPLETADO CON ÉXITO (CRM + R2)');
    console.log('=============================================');
  } catch (error) {
    console.error('❌ Error en el proceso de seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();