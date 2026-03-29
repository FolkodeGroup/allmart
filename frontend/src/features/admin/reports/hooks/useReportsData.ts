// Centraliza lógica de filtrado, KPIs y datos para gráficos
import { useMemo } from 'react';
import type { Order } from '../../../../context/AdminOrdersContext';
import type { ReportsFiltersValue, PredefinedPeriod } from '../components/ReportsFilters';

/**
 * Encapsula filtrado, KPIs y datos para gráficos de reportes.
 */
export function useReportsData(orders: Order[], filters: ReportsFiltersValue, now: number) {
    // Helpers internos
    function orderDateKey(iso: string) { return iso.slice(0, 10); }
    function lastNDayKeys(n: number): string[] {
        const today = new Date();
        const keys: string[] = [];
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            keys.push(d.toISOString().slice(0, 10));
        }
        return keys;
    }
    function isoDateLabel(iso: string) {
        const d = new Date(iso);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    }

    // Procesamiento de datos
    const ordersWithTime = useMemo(() =>
        orders.map(o => ({ ...o, createdAtMs: new Date(o.createdAt).getTime() })),
        [orders]
    );

    const period: PredefinedPeriod | 'custom' = filters.type === 'predefined' ? filters.period : 'custom';

    const periodOrders = useMemo(() => {
        if (filters.type === 'predefined') {
            if (filters.period === 'all') return ordersWithTime;
            const days = filters.period === '7d' ? 7 : filters.period === '30d' ? 30 : 90;
            const cutoff = now - days * 86400000;
            return ordersWithTime.filter(o => o.createdAtMs >= cutoff);
        } else {
            const { from, to } = filters.range;
            if (!from || !to) return [];
            const fromTime = new Date(from).setHours(0, 0, 0, 0);
            const toTime = new Date(to).setHours(23, 59, 59, 999);
            return ordersWithTime.filter(o => o.createdAtMs >= fromTime && o.createdAtMs <= toTime);
        }
    }, [ordersWithTime, filters, now]);

    const activeOrders = useMemo(() => periodOrders.filter(o => o.status !== 'cancelado'), [periodOrders]);

    // KPIs
    const kpis = useMemo(() => {
        const totalRevenue = activeOrders.reduce((s, o) => s + o.total, 0);
        const orderCount = activeOrders.length;
        const avgTicket = orderCount ? totalRevenue / orderCount : 0;
        const delivered = activeOrders.filter(o => o.status === 'entregado').length;
        const completionRate = orderCount ? Math.round((delivered / orderCount) * 100) : 0;
        const paid = periodOrders.filter(o => o.paymentStatus === 'abonado').length;
        return { totalRevenue, orderCount, avgTicket, completionRate, paid };
    }, [activeOrders, periodOrders]);

    // Métricas para KPICards
    const metrics = useMemo(() => [
        { key: 'revenue', icon: '💰', label: 'Ingresos totales', value: kpis.totalRevenue },
        { key: 'orders', icon: '🛒', label: 'Pedidos activos', value: kpis.orderCount },
        { key: 'avgTicket', icon: '🎯', label: 'Ticket promedio', value: kpis.avgTicket },
        { key: 'completion', icon: '✅', label: 'Tasa de entrega', value: `${kpis.completionRate}%` },
        { key: 'paid', icon: '💬', label: 'Abonados (WhatsApp)', value: kpis.paid },
    ], [kpis]);

    // BarChart data
    const barData = useMemo(() => {
        if (period === 'all') {
            const map = new Map<string, number>();
            ordersWithTime.forEach(o => {
                if (o.status === 'cancelado') return;
                const k = o.createdAt.slice(0, 7);
                map.set(k, (map.get(k) ?? 0) + o.total);
            });
            return [...map.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([k, v]) => ({ dateKey: k, label: new Date(k + '-01').toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }), value: v }));
        }
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const keys = lastNDayKeys(days);
        const map = new Map<string, number>(keys.map(k => [k, 0]));
        activeOrders.forEach(o => {
            const k = orderDateKey(o.createdAt);
            if (map.has(k)) map.set(k, (map.get(k) ?? 0) + o.total);
        });
        return keys.map(k => ({ dateKey: k, label: isoDateLabel(k + 'T12:00:00'), value: map.get(k) ?? 0 }));
    }, [ordersWithTime, activeOrders, period]);

    // DonutChart data
    const statusSlices = useMemo(() => {
        const map = new Map<string, number>();
        periodOrders.forEach(o => { map.set(o.status, (map.get(o.status) ?? 0) + 1); });
        const keys = ['pendiente', 'confirmado', 'en-preparacion', 'enviado', 'entregado', 'cancelado'];
        return keys.map(k => ({ key: k, count: map.get(k) ?? 0 }));
    }, [periodOrders]);

    // Fechas mín/máx para filtros
    const allDates = orders.map(o => o.createdAt.slice(0, 10));
    const minDate = allDates.length ? allDates.reduce((a, b) => (a < b ? a : b)) : undefined;
    const maxDate = allDates.length ? allDates.reduce((a, b) => (a > b ? a : b)) : undefined;

    return {
        periodOrders,
        minDate,
        maxDate,
        metrics,
        barData,
        statusSlices,
    };
}
