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
