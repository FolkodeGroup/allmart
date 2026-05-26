/**
 * jobs/collectionsJob.ts
 * Job que calcula los productos más vendidos por categoría y actualiza
 * las colecciones de tipo 'auto_sales'.
 *
 * Puede ejecutarse:
 *  - Manualmente desde el admin (POST /api/admin/collections/:id/sync)
 *  - En un cron schedule (usar node-cron o similar en index.ts)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface AutoSalesParams {
  categoryId?: string;
  windowDays?: number;  // Ventana temporal (default 30 días)
  limit?: number;        // Máx productos (default 10)
  pinnedProductIds?: string[];   // Siempre al frente
  excludeProductIds?: string[];  // Nunca mostrar
}

/**
 * Calcula los top N productos más vendidos en una categoría dentro
 * de una ventana temporal, respetando stock y visibilidad.
 *
 * Query optimizada: JOIN orders filtradas por estado + ventana, agrupa
 * por product_id y suma quantity. Índices recomendados en:
 *  - orders.created_at, orders.status
 *  - order_items.product_id
 *  - products.category_id, products.status, products.in_stock
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

  // Cláusulas opcionales construidas con Prisma.sql para seguridad
  const categoryFilter = categoryId
    ? Prisma.sql`AND p.category_id = ${categoryId}::uuid`
    : Prisma.empty;

  const excludeFilter =
    excludeProductIds.length > 0
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

  // IDs de top sellers (excluyendo pinned para insertar después)
  const topIds = rows
    .map((r) => r.product_id)
    .filter((id) => !pinnedProductIds.includes(id))
    .slice(0, Math.max(0, limit - pinnedProductIds.length));

  // Pinned siempre al frente; luego top sellers
  return [...pinnedProductIds, ...topIds];
}

/**
 * Sincroniza los CollectionItems de una colección auto_sales.
 * Elimina los ítems calculados previos y reemplaza con el nuevo ranking.
 * Los ítems con `pinned = true` (o en pinnedProductIds) siempre van primero.
 */
export async function syncAutoCollection(collectionId: string): Promise<void> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw new Error(`Colección ${collectionId} no encontrada`);
  }

  if (collection.type !== 'auto_sales') {
    throw new Error(`La colección "${collection.name}" no es de tipo auto_sales`);
  }

  const params = (collection.params ?? {}) as AutoSalesParams;
  const topIds = await getTopSellingProducts(params);

  // Reemplazar ítems en una transacción atómica
  await prisma.$transaction(async (tx) => {
    // Eliminar ítems actuales
    await tx.collectionItem.deleteMany({ where: { collectionId } });

    // Insertar nuevo ranking
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

    // Actualizar timestamp de snapshot
    await tx.collection.update({
      where: { id: collectionId },
      data: { snapshotAt: new Date() },
    });
  });
}

/**
 * Sincroniza TODAS las colecciones de tipo auto_sales activas.
 * Llamar desde cron diario o desde el admin.
 */
export async function syncAllAutoCollections(): Promise<{ synced: number; errors: string[] }> {
  const autoCollections = await prisma.collection.findMany({
    where: { type: 'auto_sales', isActive: true },
    select: { id: true, name: true },
  });

  let synced = 0;
  const errors: string[] = [];

  for (const col of autoCollections) {
    try {
      await syncAutoCollection(col.id);
      synced++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${col.name}] ${msg}`);
      console.error(`Error sincronizando colección "${col.name}":`, err);
    }
  }

  return { synced, errors };
}
