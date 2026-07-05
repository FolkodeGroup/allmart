/**
 * scripts/assign-suppliers-to-products.ts
 *
 * Seeds ProductSupplier records and SupplierProductPrice history.
 *
 * Run with:
 *   npx tsx src/scripts/assign-suppliers-to-products.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function varyPrice(base: number, minPct: number, maxPct: number): number {
  const factor = 1 + randomBetween(minPct, maxPct) / 100;
  return Math.round(base * factor * 100) / 100;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const REASONS = ['regular', 'promotion', 'adjustment', 'negotiation', 'market_adjustment'];

async function generatePriceHistory(
  productId: string,
  supplierId: string,
  finalPrice: number,
  count: number,
  spanDays: number,
) {
  const entries = [];
  let price = finalPrice;

  for (let i = count - 1; i >= 0; i--) {
    const createdAt = daysAgo(Math.round((i / count) * spanDays));
    entries.push({
      productId,
      supplierId,
      price,
      changeReason: REASONS[Math.floor(Math.random() * REASONS.length)],
      createdAt,
    });
    // Each historical entry had slightly different price (vary ±5-10%)
    price = varyPrice(price, -10, 10);
    if (price <= 0) price = finalPrice * 0.5;
  }

  // Most recent entry = final price
  entries[entries.length - 1] = {
    productId,
    supplierId,
    price: finalPrice,
    changeReason: 'regular',
    createdAt: daysAgo(0),
  };

  await prisma.supplierProductPrice.createMany({ data: entries, skipDuplicates: false });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏪  Seeding suppliers and price history...\n');

  // 1. Ensure the 5 demo suppliers exist (upsert by name)
  const supplierDefs = [
    {
      name: 'Distribuidor General',
      phone: '+54 11 4000-0001',
      address: 'Av. Corrientes 1234, CABA',
      email: 'ventas@distribuidorgeneral.com',
      description: 'Proveedor principal para todos los productos del catálogo.',
    },
    {
      name: 'Mayorista del Sur',
      phone: '+54 11 4000-0002',
      address: 'Ruta 2, km 50, Chascomús',
      email: 'contacto@mayoristadelsur.com',
      description: 'Especialistas en distribución regional con precios competitivos.',
    },
    {
      name: 'Importador Directo',
      phone: '+54 11 4000-0003',
      address: 'Dock Sur, Avellaneda',
      email: 'importaciones@importadordirecto.com',
      description: 'Importación directa desde fabricantes internacionales.',
    },
    {
      name: 'Distribuidor Premium',
      phone: '+54 11 4000-0004',
      address: 'Av. Santa Fe 4500, CABA',
      email: 'premium@distribuidorpremium.com',
      description: 'Productos de alta gama con servicio personalizado.',
    },
    {
      name: 'Fornecedor Alternativo',
      phone: '+54 11 4000-0005',
      address: 'Parque Industrial, Pilar',
      email: 'ventas@fornecedoralternativo.com',
      description: 'Alternativa de respaldo para productos de alta rotación.',
    },
  ];

  const suppliers = [];
  for (const def of supplierDefs) {
    const existing = await prisma.supplier.findFirst({ where: { name: def.name } });
    if (existing) {
      suppliers.push(existing);
      console.log(`  ↩  Found existing: ${def.name}`);
    } else {
      // 🔒 CORRECCIÓN: Se remueve products de la creación
      const s = await prisma.supplier.create({
        data: { ...def, isActive: true }, 
      });
      suppliers.push(s);
      console.log(`  ✅  Created: ${def.name}`);
    }
  }

  const [general, mayoristasSur, importador, premium, alternativo] = suppliers;

  // 2. Load all active products
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    select: { id: true, price: true, primarySupplierId: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\n📦  Found ${products.length} active products\n`);

  if (products.length === 0) {
    console.log('No active products found — nothing to seed.');
    return;
  }

  let assigned = 0;

  for (const product of products) {
    const basePrice = Number(product.price);
    const cost = Math.round(basePrice * randomBetween(0.4, 0.65) * 100) / 100;

    // Assign "Distribuidor General" to ALL products
    const generalPrice = varyPrice(basePrice, -2, 2);
    await prisma.productSupplier.upsert({
      where: { productId_supplierId: { productId: product.id, supplierId: general.id } },
      create: { productId: product.id, supplierId: general.id, currentPrice: generalPrice, cost, isActive: true },
      update: { currentPrice: generalPrice, cost, isActive: true },
    });
    await generatePriceHistory(product.id, general.id, generalPrice, 12, 90);

    // Assign "Mayorista del Sur" to ~30% of products
    if (Math.random() < 0.30) {
      const surPrice = varyPrice(basePrice, -10, -5);
      await prisma.productSupplier.upsert({
        where: { productId_supplierId: { productId: product.id, supplierId: mayoristasSur.id } },
        create: { productId: product.id, supplierId: mayoristasSur.id, currentPrice: surPrice, cost: cost * 0.9, isActive: true },
        update: { currentPrice: surPrice, isActive: true },
      });
      await generatePriceHistory(product.id, mayoristasSur.id, surPrice, 8, 60);
    }

    // Assign "Importador Directo" to ~20%
    if (Math.random() < 0.20) {
      const impPrice = varyPrice(basePrice, -15, 5);
      await prisma.productSupplier.upsert({
        where: { productId_supplierId: { productId: product.id, supplierId: importador.id } },
        create: { productId: product.id, supplierId: importador.id, currentPrice: impPrice, isActive: true },
        update: { currentPrice: impPrice, isActive: true },
      });
      await generatePriceHistory(product.id, importador.id, impPrice, 6, 45);
    }

    // Assign "Distribuidor Premium" to ~10%
    if (Math.random() < 0.10) {
      const premPrice = varyPrice(basePrice, 10, 20);
      await prisma.productSupplier.upsert({
        where: { productId_supplierId: { productId: product.id, supplierId: premium.id } },
        create: { productId: product.id, supplierId: premium.id, currentPrice: premPrice, isActive: true },
        update: { currentPrice: premPrice, isActive: true },
      });
      await generatePriceHistory(product.id, premium.id, premPrice, 5, 30);
    }

    // Assign "Fornecedor Alternativo" to ~15%
    if (Math.random() < 0.15) {
      const altPrice = varyPrice(basePrice, -8, 8);
      await prisma.productSupplier.upsert({
        where: { productId_supplierId: { productId: product.id, supplierId: alternativo.id } },
        create: { productId: product.id, supplierId: alternativo.id, currentPrice: altPrice, isActive: true },
        update: { currentPrice: altPrice, isActive: true },
      });
      await generatePriceHistory(product.id, alternativo.id, altPrice, 6, 50);
    }

    // If product has no primarySupplierId, set it to Distribuidor General
    if (!product.primarySupplierId) {
      await prisma.product.update({
        where: { id: product.id },
        data: { primarySupplierId: general.id },
      });
    }

    assigned++;
    if (assigned % 10 === 0) {
      process.stdout.write(`  Progress: ${assigned}/${products.length}\r`);
    }
  }

  console.log(`\n\n✅  Done! Assigned suppliers to ${assigned} products.`);

  const totalPS = await prisma.productSupplier.count();
  const totalHistory = await prisma.supplierProductPrice.count();
  console.log(`📊  ProductSupplier rows: ${totalPS}`);
  console.log(`📊  SupplierProductPrice rows: ${totalHistory}`);
}

main()
  .catch(err => {
    console.error('❌  Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());