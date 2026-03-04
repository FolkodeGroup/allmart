/**
 * services/admin/reportsService.ts
 * Servicio de reportes para panel admin.
 */

import { prisma } from "../config/prisma";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const periodMap: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function getStartDate(period?: string): Date {
  const days = periodMap[period || "7d"] || 7;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// ─────────────────────────────────────────────────────────────
// 1️⃣ Summary
// ─────────────────────────────────────────────────────────────

export const getSummary = async (period?: string) => {
  const startDate = getStartDate(period);

  // Totales históricos
  const total = await prisma.order.aggregate({
    where: {
      status: { not: "cancelado" },
    },
    _count: { id: true },
    _sum: { total: true },
    _avg: { total: true },
  });

  // Totales por período
  const periodData = await prisma.order.aggregate({
    where: {
      status: { not: "cancelado" },
      createdAt: { gte: startDate },
    },
    _count: { id: true },
    _sum: { total: true },
  });

  return {
    totalOrders: total._count.id,
    totalRevenue: total._sum.total ?? 0,
    averageTicket: total._avg.total ?? 0,
    periodOrders: periodData._count.id,
    periodRevenue: periodData._sum.total ?? 0,
  };
};

// ─────────────────────────────────────────────────────────────
// 2️⃣ Sales by Day (con DATE_TRUNC real)
// ─────────────────────────────────────────────────────────────

export const getSalesByDay = async (period?: string) => {
  const startDate = getStartDate(period);

  const result = await prisma.$queryRaw<
    { day: Date; revenue: number; orders: number }[]
  >`
    SELECT 
      DATE_TRUNC('day', o.created_at) AS day,
      COUNT(*) AS orders,
      COALESCE(SUM(o.total), 0) AS revenue
    FROM orders o
    WHERE o.created_at >= ${startDate}
    AND o.status != 'cancelado'
    GROUP BY day
    ORDER BY day ASC
  `;

  return result.map((row) => ({
    day: row.day,
    orders: Number(row.orders),
    revenue: Number(row.revenue),
  }));
};

// ─────────────────────────────────────────────────────────────
// 3️⃣ Orders by Status
// ─────────────────────────────────────────────────────────────

export const getOrdersByStatus = async () => {
  const data = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  return data.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));
};

// ─────────────────────────────────────────────────────────────
// 4️⃣ Top Products
// ─────────────────────────────────────────────────────────────

export const getTopProducts = async (limit = 10) => {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        status: { not: "cancelado" },
      },
      productId: { not: null },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  const productIds = grouped
    .map((g) => g.productId)
    .filter((id): id is string => !!id);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  return grouped.map((item) => {
    const product = products.find((p) => p.id === item.productId);

    return {
      productId: item.productId,
      productName: product?.name ?? "Producto",
      quantitySold: item._sum.quantity ?? 0,
    };
  });
};