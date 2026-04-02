// hooks/useOrdersFilters.ts
import { useState, useMemo } from 'react';
import type { Order, OrderStatus } from '../../../../context/AdminOrdersContext';

export interface OrdersFiltersState {
    search: string;
    statuses: string[];
    dateFrom: string;
    dateTo: string;
}

const INITIAL: OrdersFiltersState = {
    search: '',
    statuses: [],
    dateFrom: '',
    dateTo: '',
};

export function useOrdersFilters(orders: Order[]) {
    const [filters, setFilters] = useState<OrdersFiltersState>(INITIAL);

    const filtered = useMemo(() => {
        return orders.filter(o => {
            const q = filters.search.toLowerCase();

            const matchSearch =
                !q ||
                o.id.toLowerCase().includes(q) ||
                o.customer.firstName.toLowerCase().includes(q) ||
                o.customer.lastName.toLowerCase().includes(q) ||
                o.customer.email.toLowerCase().includes(q);

            const matchStatus =
                !filters.statuses.length || filters.statuses.includes(o.status);

            const date = new Date(o.createdAt).getTime();
            const matchFrom = !filters.dateFrom || date >= new Date(filters.dateFrom).getTime();
            const matchTo = !filters.dateTo || date <= new Date(filters.dateTo + 'T23:59:59').getTime();

            return matchSearch && matchStatus && matchFrom && matchTo;
        });
    }, [orders, filters]);

    const hasActiveFilters =
        !!filters.search ||
        filters.statuses.length > 0 ||
        !!filters.dateFrom ||
        !!filters.dateTo;

    const reset = () => setFilters(INITIAL);

    return { filters, setFilters, filtered, hasActiveFilters, reset };
}