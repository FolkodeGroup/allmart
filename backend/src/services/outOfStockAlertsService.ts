/**
 * services/outOfStockAlertsService.ts
 * Servicio para alertar sobre pedidos pendientes de productos sin stock
 */

import { prisma } from '../config/prisma';
import { ProductStatus } from '@prisma/client';

export interface OutOfStockOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
}

export interface OutOfStockOrder {
  id: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: string;
  total: string;
  createdAt: Date;
  items: OutOfStockOrderItem[];
}

export interface OutOfStockAlert {
  productId: string;
  productName: string;
  productSku: string | null;
  stock: number;
  totalPendingOrders: number;
  totalQuantityOrdered: number;
  orders: OutOfStockOrder[];
}

export interface OutOfStockAlertsResponse {
  data: OutOfStockAlert[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Obtiene productos sin stock que tienen pedidos pendientes o confirmados,
 * excluyendo productos archivados (Soft Deleted).
 */
export async function getOutOfStockAlerts(
  page = 1,
  limit = 20,
): Promise<OutOfStockAlertsResponse> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
  const skip = (safePage - 1) * safeLimit;

  // Obtener productos sin stock (base product) y SKUs sin stock (variants)
  const [productsWithoutStock, skusWithoutStock] = await Promise.all([
    prisma.product.findMany({
      where: {
        stock: { lte: 0 },
        status: { not: ProductStatus.archived }
      },
      select: { id: true, name: true, sku: true, stock: true },
    }),
    prisma.productSku.findMany({
      where: { stock: { lte: 0 }, isActive: true },
      select: { id: true, productId: true, sku: true, stock: true },
    }),
  ]);

  if (productsWithoutStock.length === 0 && skusWithoutStock.length === 0) {
    return {
      data: [],
      total: 0,
      page: safePage,
      limit: safeLimit,
      pages: 0,
    };
  }

  const productIds = productsWithoutStock.map(p => p.id);
  const skuIds = skusWithoutStock.map(s => s.id);

  // Obtener órdenes pendientes/confirmadas que contienen estos productos o SKUs
  const ordersWithOutOfStockItems = await prisma.order.findMany({
    where: {
      status: { in: ['pendiente', 'confirmado'] },
      OR: [
        { orderItems: { some: { productId: { in: productIds } } } },
        { orderItems: { some: { productSkuId: { in: skuIds } } } },
      ],
    },
    select: {
      id: true,
      customerFirstName: true,
      customerLastName: true,
      customerEmail: true,
      customerPhone: true,
      status: true,
      total: true,
      createdAt: true,
      orderItems: {
        where: {
          OR: [
            { productId: { in: productIds } },
            { productSkuId: { in: skuIds } },
          ],
        },
        select: {
          id: true,
          productId: true,
          productSkuId: true,
          productName: true,
          quantity: true,
          unitPrice: true,
        },
      },
    },
  });

  // Agrupar por producto o por SKU (clave compuesta)
  const alertsByKey = new Map<string, OutOfStockAlert>();

  for (const product of productsWithoutStock) {
    const key = product.id; // product-level alert
    alertsByKey.set(key, {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      stock: product.stock,
      totalPendingOrders: 0,
      totalQuantityOrdered: 0,
      orders: [],
    });
  }

  for (const sku of skusWithoutStock) {
    const key = `${sku.productId}::${sku.id}`; // sku-level alert key
    // Try to reuse product name if available
    const parent = productsWithoutStock.find(p => p.id === sku.productId);
    const name = parent ? parent.name : 'Producto';
    alertsByKey.set(key, {
      productId: sku.productId,
      productName: name,
      productSku: sku.sku,
      stock: sku.stock,
      totalPendingOrders: 0,
      totalQuantityOrdered: 0,
      orders: [],
    });
  }

  // Llenar datos de órdenes
  for (const order of ordersWithOutOfStockItems) {
    for (const item of order.orderItems) {
      // determine if this item maps to a sku-level alert or product-level alert
      const skuKey = item.productSkuId ? `${item.productId}::${item.productSkuId}` : null;
      const productKey = item.productId!;

      const alert = (skuKey && alertsByKey.has(skuKey)) ? alertsByKey.get(skuKey)! : alertsByKey.get(productKey);
      if (alert) {
        // Agregar orden si no existe
        if (!alert.orders.find(o => o.id === order.id)) {
          alert.orders.push({
            id: order.id,
            customerFirstName: order.customerFirstName,
            customerLastName: order.customerLastName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            status: order.status,
            total: order.total.toString(),
            createdAt: order.createdAt,
            items: [],
          });
          alert.totalPendingOrders++;
        }

        // Agregar item a la orden
        const orderInAlert = alert.orders.find(o => o.id === order.id);
        if (orderInAlert && !orderInAlert.items.find(i => i.id === item.id)) {
          orderInAlert.items.push({
            id: item.id,
            productId: item.productId!,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
          });
          alert.totalQuantityOrdered += item.quantity;
        }
      }
    }
  }

  // Filtrar solo alertas que tienen órdenes
  const alertsWithOrders = Array.from(alertsByKey.values())
    .filter(alert => alert.orders.length > 0)
    .sort((a, b) => b.totalQuantityOrdered - a.totalQuantityOrdered);

  const total = alertsWithOrders.length;

  // Paginar
  const paginatedAlerts = alertsWithOrders.slice(skip, skip + safeLimit);

  return {
    data: paginatedAlerts,
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

/**
 * Obtiene el conteo total de alertas sin stock, excluyendo productos archivados.
 */
export async function getOutOfStockAlertCount(): Promise<number> {
  const productsWithoutStock = await prisma.product.findMany({
    where: {
      stock: { lte: 0 },
      status: { not: ProductStatus.archived } // 🔒 CORRECCIÓN: Uso de enum de Prisma
    },
    select: { id: true },
  });

  if (productsWithoutStock.length === 0) return 0;

  const productIds = productsWithoutStock.map(p => p.id);

  const count = await prisma.order.count({
    where: {
      status: { in: ['pendiente', 'confirmado'] },
      orderItems: {
        some: {
          productId: { in: productIds },
        },
      },
    },
  });

  return count;
}

/**
 * Obtiene alertas para un producto específico sin stock
 */
export async function getOutOfStockAlertsByProductId(productId: string): Promise<OutOfStockAlert | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, sku: true, stock: true },
  });

  if (!product || product.stock > 0) {
    return null;
  }

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['pendiente', 'confirmado'] },
      orderItems: {
        some: {
          productId: productId,
        },
      },
    },
    select: {
      id: true,
      customerFirstName: true,
      customerLastName: true,
      customerEmail: true,
      customerPhone: true,
      status: true,
      total: true,
      createdAt: true,
      orderItems: {
        where: { productId },
        select: {
          id: true,
          productId: true,
          productName: true,
          quantity: true,
          unitPrice: true,
        },
      },
    },
  });

  let totalQuantityOrdered = 0;
  const formattedOrders: OutOfStockOrder[] = orders.map(order => {
    const items: OutOfStockOrderItem[] = order.orderItems.map(item => {
      totalQuantityOrdered += item.quantity;
      return {
        id: item.id,
        productId: item.productId!,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      };
    });

    return {
      id: order.id,
      customerFirstName: order.customerFirstName,
      customerLastName: order.customerLastName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      status: order.status,
      total: order.total.toString(),
      createdAt: order.createdAt,
      items,
    };
  });

  return {
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    stock: product.stock,
    totalPendingOrders: formattedOrders.length,
    totalQuantityOrdered,
    orders: formattedOrders,
  };
}