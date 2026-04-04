/**
 * services/lowStockAlertsService.ts
 * Servicio para manejar alertas de stock bajo
 */

import { prisma } from '../config/prisma';

export interface LowStockAlertWithOrder {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantitySold: number;
  stockBefore: number;
  stockAfter: number;
  createdAt: Date;
  order: {
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
  };
}

export type StockAlertLevel = 'no_stock' | 'low_stock';

export interface CurrentLowStockProduct {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  inStock: boolean;
  status: string;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  alertLevel: StockAlertLevel;
}

export interface CurrentLowStockProductsResponse {
  data: CurrentLowStockProduct[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  summary: {
    noStock: number;
    lowStock: number;
    threshold: number;
  };
}

const DEFAULT_STOCK_THRESHOLD = 5;

export async function getLowStockAlerts(page = 1, limit = 20): Promise<{
  data: LowStockAlertWithOrder[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}> {
  const skip = (page - 1) * limit;

  const [alerts, total] = await Promise.all([
    prisma.lowStockAlert.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            customerFirstName: true,
            customerLastName: true,
            customerEmail: true,
          },
        },
      },
    }),
    prisma.lowStockAlert.count(),
  ]);

  return {
    data: alerts as LowStockAlertWithOrder[],
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getCurrentLowStockProducts(
  page = 1,
  limit = 20,
  threshold = DEFAULT_STOCK_THRESHOLD,
): Promise<CurrentLowStockProductsResponse> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
  const safeThreshold = Number.isFinite(threshold) && threshold >= 0
    ? Math.floor(threshold)
    : DEFAULT_STOCK_THRESHOLD;

  const skip = (safePage - 1) * safeLimit;
  const where = { stock: { lte: safeThreshold } };

  const [products, total, noStock] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: [
        { stock: 'asc' },
        { updatedAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        inStock: true,
        status: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.count({
      where: {
        stock: { lte: 0 },
      },
    }),
  ]);

  const data: CurrentLowStockProduct[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    inStock: product.inStock,
    status: product.status,
    updatedAt: product.updatedAt,
    category: product.category,
    alertLevel: product.stock <= 0 ? 'no_stock' : 'low_stock',
  }));

  return {
    data,
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
    summary: {
      noStock,
      lowStock: Math.max(0, total - noStock),
      threshold: safeThreshold,
    },
  };
}

export async function getLowStockAlertsByProductId(productId: string): Promise<LowStockAlertWithOrder[]> {
  return prisma.lowStockAlert.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          customerFirstName: true,
          customerLastName: true,
          customerEmail: true,
        },
      },
    },
  }) as Promise<LowStockAlertWithOrder[]>;
}

export async function getLowStockAlertCount(): Promise<number> {
  return prisma.lowStockAlert.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
      },
    },
  });
}
