// Centraliza lógica de filtrado, KPIs y datos para gráficos
import { useMemo } from 'react';
import type { Order } from '../../../../context/AdminOrdersContext';
import type { ReportsFiltersValue } from '../components/ReportsFilters';
import { parseDateStartLocal, createdAtToMs, parseDateEndLocal } from '../../../../utils/date';

/**
 * Encapsula filtrado, KPIs y datos para gráficos de reportes.
 */
export function useReportsData(
    orders: Order[],
    filters: ReportsFiltersValue,
    ordersTableFilters: {
        status: string[];
        clientQuery: string;
        productQuery: string;
    },
    now: number
) {
    const ordersWithTime = useMemo(() =>
        orders.map(o => ({
            ...o,
            createdAtMs: createdAtToMs(o.createdAt)
        })),
        [orders]
    );



    const period = filters.type === 'predefined' ? filters.period : 'custom';

    // ✅ FILTRO PRINCIPAL (FECHAS)
    const periodOrders = useMemo(() => {
        if (filters.type === 'predefined') {
            if (filters.period === 'all') return ordersWithTime;

            const days =
                filters.period === '7d' ? 7 :
                    filters.period === '30d' ? 30 : 90;


            const cutoff = now - days * 86400000;

            return ordersWithTime.filter(o => o.createdAtMs >= cutoff);
        }

        const { from, to } = filters.range;
        if (!from || !to) return [];

        const fromMs = parseDateStartLocal(from);  // 00:00:00.000 del día "from"
        const toMs = parseDateEndLocal(to);      // 23:59:59.999 del día "to"

        return ordersWithTime.filter(o =>
            o.createdAtMs >= fromMs && o.createdAtMs <= toMs
        );
    }, [ordersWithTime, filters, now]);

    // FILTROS DE TABLA
    const filteredOrdersTable = useMemo(() => {
        let filtered = periodOrders;

        if (ordersTableFilters.status.length) {
            filtered = filtered.filter(o =>
                ordersTableFilters.status.includes(o.status)
            );
        }

        if (ordersTableFilters.clientQuery.trim()) {
            const q = ordersTableFilters.clientQuery.toLowerCase();

            filtered = filtered.filter(o => {
                const c = o.customer;
                return (
                    c.firstName?.toLowerCase().includes(q) ||
                    c.lastName?.toLowerCase().includes(q) ||
                    c.email?.toLowerCase().includes(q)
                );
            });
        }

        if (ordersTableFilters.productQuery.trim()) {
            const pq = ordersTableFilters.productQuery.toLowerCase();

            filtered = filtered.filter(o =>
                o.items?.some(it =>
                    it.productName?.toLowerCase().includes(pq)
                )
            );
        }

        return filtered;
    }, [periodOrders, ordersTableFilters]);

    // ✅ KPIs
    const activeOrders = useMemo(
        () => periodOrders.filter(o => o.status !== 'cancelado'),
        [periodOrders]
    );

    const kpis = useMemo(() => {
        const totalRevenue = activeOrders.reduce((s, o) => s + o.total, 0);
        const orderCount = activeOrders.length;

        const paid = activeOrders.filter(o => o.paymentStatus).length; // o la lógica que uses

        return {
            totalRevenue,
            orderCount,
            avgTicket: orderCount ? totalRevenue / orderCount : 0,
            completionRate: orderCount
                ? Math.round(
                    (activeOrders.filter(o => o.status === 'entregado').length /
                        orderCount) * 100
                )
                : 0,
            paid // ✅ agregado
        };
    }, [activeOrders]);

    return {
        period,
        periodOrders,
        filteredOrdersTable,
        activeOrders,
        kpis
    };
}