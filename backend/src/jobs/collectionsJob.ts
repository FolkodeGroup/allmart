/**
 * jobs/collectionsJob.ts
 * Job que calcula los productos más vendidos por categoría (incluyendo subcategorías)
 * y actualiza las colecciones de tipo 'auto_sales' y 'dynamic_rules'.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface AutoSalesParams {
  categoryId?: string;
  windowDays?: number;         // Ventana temporal (default 30 días)
  limit?: number;              // Máx productos (default 10)
  pinnedProductIds?: string[];  // Siempre al frente
  excludeProductIds?: string[]; // Nunca mostrar
  requiredTag?: string;         // Para reglas dinámicas: 'oferta', 'destacado', 'novedad'
  minDiscount?: number;
  inStockOnly?: boolean;
  startDate?: string;          // Programación de campaña
  endDate?: string;            // Fin de campaña
}

/**
 * Obtiene el ID de la categoría dada junto con todos los IDs de sus subcategorías hijas.
 */
async function getCategoryFamilyIds(categoryId?: string): Promise<string[]> {
  if (!categoryId) return [];

  const children = await prisma.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });

  return [categoryId, ...children.map((c) => c.id)];
}

/**
 * Calcula los top N productos más vendidos en una categoría (y sus subcategorías)
 * dentro de una ventana temporal, respetando stock y estado activo.
 */
export async function getTopSellingProducts(
  params: AutoSalesParams
): Promise<string[]> {
  const {
    categoryId,
    windowDays = 30,
    limit = 10,
    pinnedProductIds = [],
    excludeProductIds = [],
  } = params;

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  // 🟢 RESOLUCIÓN JERÁRQUICA: Obtener categoría padre + subcategorías hijas
  const categoryIds = await getCategoryFamilyIds(categoryId);

  const categoryFilter = categoryIds.length > 0
    ? Prisma.sql`AND EXISTS (
        SELECT 1 FROM product_categories pc
        WHERE pc.product_id = p.id
          AND pc.category_id IN (${Prisma.join(categoryIds.map(id => Prisma.sql`${id}::uuid`), ',')})
      )`
    : Prisma.empty;

  const excludeFilter = excludeProductIds.length > 0
    ? Prisma.sql`AND oi.product_id NOT IN (${Prisma.join(
        excludeProductIds.map((id) => Prisma.sql`${id}::uuid`),
        ','
      )})`
    : Prisma.empty;

  type TopProduct = { product_id: string; total_sold: bigint };

  const rows = await prisma.$queryRaw<TopProduct[]>(
    Prisma.sql`
      SELECT
        oi.product_id,
        SUM(oi.quantity)::BIGINT AS total_sold
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      INNER JOIN products p ON p.id = oi.product_id
      WHERE
        o.status NOT IN ('cancelado')
        AND o.created_at >= ${windowStart}
        AND oi.product_id IS NOT NULL
        AND p.status = 'active'
        AND p.in_stock = TRUE
        AND p.stock > 0
        ${categoryFilter}
        ${excludeFilter}
      GROUP BY oi.product_id
      ORDER BY total_sold DESC
      LIMIT ${limit * 2}
    `
  );

  const topIds = rows
    .map((r) => r.product_id)
    .filter((id) => !pinnedProductIds.includes(id))
    .slice(0, Math.max(0, limit - pinnedProductIds.length));

  return [...pinnedProductIds, ...topIds];
}

/**
 * Sincroniza los CollectionItems de una colección auto_sales.
 */
export async function syncAutoCollection(collectionId: string): Promise<void> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw new Error(`Colección ${collectionId} no encontrada`);
  }

  if (collection.type === 'dynamic_rules') {
    return syncDynamicCollection(collectionId);
  }

  if (collection.type !== 'auto_sales') {
    throw new Error(`La colección "${collection.name}" no es de tipo auto_sales`);
  }

  const params = (collection.params ?? {}) as AutoSalesParams;

  // Validar vigencia de fechas si están configuradas
  const now = new Date();
  if (params.startDate && new Date(params.startDate) > now) return;
  if (params.endDate && new Date(params.endDate) < now) return;

  const topIds = await getTopSellingProducts(params);

  await prisma.$transaction(async (tx) => {
    await tx.collectionItem.deleteMany({ where: { collectionId } });

    if (topIds.length > 0) {
      await tx.collectionItem.createMany({
        data: topIds.map((productId, index) => ({
          collectionId,
          productId,
          position: index,
        })),
        skipDuplicates: true,
      });
    }

    await tx.collection.update({
      where: { id: collectionId },
      data: { snapshotAt: new Date() },
    });
  });
}

/**
 * Sincroniza los CollectionItems de una colección de tipo dynamic_rules.
 */
export async function syncDynamicCollection(collectionId: string): Promise<void> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw new Error(`Colección ${collectionId} no encontrada`);
  }

  const params = (collection.params ?? {}) as AutoSalesParams;
  const { categoryId, requiredTag, inStockOnly = true, limit = 10 } = params;

  // Validar vigencia de fechas si están configuradas
  const now = new Date();
  if (params.startDate && new Date(params.startDate) > now) return;
  if (params.endDate && new Date(params.endDate) < now) return;

  const where: any = { status: 'active' };

  if (inStockOnly) {
    where.inStock = true;
    where.stock = { gt: 0 };
  }

  if (categoryId) {
    const familyIds = await getCategoryFamilyIds(categoryId);
    where.productCategories = {
      some: { categoryId: { in: familyIds } },
    };
  }

  if (requiredTag && requiredTag.trim()) {
    where.productTags = {
      some: {
        tag: {
          name: { equals: requiredTag.trim().toLowerCase(), mode: 'insensitive' },
        },
      },
    };
  }

  const matchedProducts = await prisma.product.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  const productIds = matchedProducts.map((p) => p.id);

  await prisma.$transaction(async (tx) => {
    await tx.collectionItem.deleteMany({ where: { collectionId } });

    if (productIds.length > 0) {
      await tx.collectionItem.createMany({
        data: productIds.map((productId, index) => ({
          collectionId,
          productId,
          position: index,
        })),
        skipDuplicates: true,
      });
    }

    await tx.collection.update({
      where: { id: collectionId },
      data: { snapshotAt: new Date() },
    });
  });
}

/**
 * Sincroniza TODAS las colecciones automáticas y de reglas dinámicas activas.
 */
export async function syncAllAutoCollections(): Promise<{ synced: number; errors: string[] }> {
  const autoCollections = await prisma.collection.findMany({
    where: {
      type: { in: ['auto_sales', 'dynamic_rules'] },
      isActive: true,
    },
    select: { id: true, name: true, type: true },
  });

  let synced = 0;
  const errors: string[] = [];

  for (const col of autoCollections) {
    try {
      if (col.type === 'dynamic_rules') {
        await syncDynamicCollection(col.id);
      } else {
        await syncAutoCollection(col.id);
      }
      synced++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${col.name}] ${msg}`);
      console.error(`Error sincronizando colección "${col.name}":`, err);
    }
  }

  return { synced, errors };
}