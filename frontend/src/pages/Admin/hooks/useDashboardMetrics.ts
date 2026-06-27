import { useMemo } from 'react';
import type { Order } from '../../../context/AdminOrdersContext';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import type { WeeklySalesData } from '../../../components/ui/WeeklySalesWidget';

const CATEGORY_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c',
  '#d0ed57', '#8dd1e1', '#83a6ed', '#ea7e7e', '#b47ae7',
];

const toNumber = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
};

/**
 * useDashboardMetrics
 * Centraliza el cálculo de TODAS las métricas y agregaciones del dashboard
 * a partir de `orders` y `products`. Cada cálculo está memoizado de forma
 * independiente para evitar recomputaciones innecesarias.
 */
export function useDashboardMetrics(orders: Order[], products: AdminProduct[]) {
  const ingresos = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders]);
  const totalPedidos = orders.length;
  const clientesUnicos = useMemo(
    () => new Set(orders.map((o) => o.customer.email)).size,
    [orders],
  );
  const tasaConversion = clientesUnicos === 0 ? 0 : (totalPedidos / clientesUnicos) * 100;
  const ticketPromedio = totalPedidos === 0 ? 0 : ingresos / totalPedidos;

  const pendientes = useMemo(
    () => orders.filter((o) => o.status === 'pendiente').length,
    [orders],
  );

  const lowStock = useMemo(
    () => products.filter((p) => typeof p.stock === 'number' && p.stock <= 5 && p.stock > 0).length,
    [products],
  );

  const categoryData = useMemo(() => {
    const productCatMap = products.reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = p.category?.name || 'Sin categoría';
      return acc;
    }, {});
    const totals: Record<string, number> = {};
    orders.forEach((o) =>
      o.items.forEach((item) => {
        const cat = productCatMap[item.productId] || 'Sin categoría';
        totals[cat] = (totals[cat] || 0) + item.quantity;
      }),
    );
    return Object.entries(totals)
      .map(([category, value], i) => ({ category, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [orders, products]);

  const topProducts = useMemo(() => {
    const salesMap: Record<string, { name: string; sku: string; sales: number }> = {};
    orders.forEach((o) =>
      o.items.forEach((item) => {
        if (!salesMap[item.productId]) {
          const prod = products.find((p) => p.id === item.productId);
          salesMap[item.productId] = { name: item.productName, sku: prod?.sku || '', sales: 0 };
        }
        salesMap[item.productId].sales += item.quantity;
      }),
    );
    return Object.values(salesMap).sort((a, b) => b.sales - a.sales).slice(0, 10);
  }, [orders, products]);

  const topClients = useMemo(() => {
    const clientMap: Record<string, { name: string; email: string; total: number; orders: number }> = {};
    orders.forEach((o) => {
      const key = o.customer.email;
      if (!clientMap[key]) {
        clientMap[key] = { name: `${o.customer.firstName} ${o.customer.lastName}`, email: key, total: 0, orders: 0 };
      }
      clientMap[key].total += o.total;
      clientMap[key].orders += 1;
    });
    return Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  const currentMonthRevenue = useMemo(() => {
    const now = new Date();
    return orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, o) => s + o.total, 0);
  }, [orders]);

  const weeklySalesData = useMemo<WeeklySalesData[]>(() => {
    const now = new Date();
    const days: WeeklySalesData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('es-AR', { weekday: 'short' });
      const count = orders.filter((o) => {
        const od = new Date(o.createdAt);
        return od.toDateString() === d.toDateString();
      }).length;
      days.push({ day: dayStr, sales: count });
    }
    return days;
  }, [orders]);

  const weeklyTotalSales = useMemo(
    () => weeklySalesData.reduce((s, d) => s + d.sales, 0),
    [weeklySalesData],
  );

  // ── Variaciones mes anterior ──────────────────────────────────────────────────
  const prevMonthMetrics = useMemo(() => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const prevOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const prevIngresos = prevOrders.reduce((s, o) => s + toNumber(o.total), 0);
    const prevPedidos = prevOrders.length;
    const prevClientes = new Set(prevOrders.map((o) => o.customer.email)).size;
    const prevTicket = prevPedidos === 0 ? 0 : prevIngresos / prevPedidos;
    const prevConversion = prevClientes === 0 ? 0 : (prevPedidos / prevClientes) * 100;

    return { prevIngresos, prevPedidos, prevClientes, prevTicket, prevConversion };
  }, [orders]);

  const calcVariation = (current: number, prev: number): number => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const variaciones = useMemo(() => ({
    ingresos: calcVariation(currentMonthRevenue, prevMonthMetrics.prevIngresos),
    pedidos: calcVariation(
      orders.filter((o) => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
      prevMonthMetrics.prevPedidos
    ),
    clientes: calcVariation(
      new Set(
        orders
          .filter((o) => {
            const d = new Date(o.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .map((o) => o.customer.email)
      ).size,
      prevMonthMetrics.prevClientes
    ),
    ticketPromedio: calcVariation(ticketPromedio, prevMonthMetrics.prevTicket),
    conversion: calcVariation(tasaConversion, prevMonthMetrics.prevConversion),
  }), [currentMonthRevenue, orders, ticketPromedio, tasaConversion, prevMonthMetrics]);

  return {
    ingresos,
    totalPedidos,
    clientesUnicos,
    tasaConversion,
    ticketPromedio,
    pendientes,
    lowStock,
    categoryData,
    topProducts,
    topClients,
    currentMonthRevenue,
    weeklySalesData,
    weeklyTotalSales,
    variaciones,
  };
}
