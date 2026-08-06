// hooks/useOrdersFilters.ts
import { useState, useMemo } from 'react';
import type { Order } from '../../../../context/AdminOrdersContext';
import { formatDateLocal } from '../../../../utils/date';

export interface OrdersFiltersState {
    search: string;
    status: string | '';
    dateFrom: string;
    dateTo: string;
    totalMin: string;
    totalMax: string;
}

const getInitialState = (): OrdersFiltersState => ({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: formatDateLocal(new Date()), // Preselección automática de la fecha del día en curso
    totalMin: '',
    totalMax: '',
});

export function useOrdersFilters(orders: Order[]) {
    const [filters, setFilters] = useState<OrdersFiltersState>(getInitialState);

    const filtered = useMemo(() => {
        return orders.filter(o => {
            const q = filters.search.toLowerCase();

            const matchSearch =
                !q ||
                o.id.toLowerCase().includes(q) ||
                o.customer.firstName.toLowerCase().includes(q) ||
                o.customer.lastName.toLowerCase().includes(q) ||
                o.customer.email.toLowerCase().includes(q) ||
                o.customer.phone?.toLowerCase().includes(q);

            const matchStatus = !filters.status || o.status === filters.status;

            const date = new Date(o.createdAt).getTime();
            const matchFrom = !filters.dateFrom || date >= new Date(filters.dateFrom).getTime();
            const matchTo = !filters.dateTo || date <= new Date(filters.dateTo + 'T23:59:59').getTime();
            const matchTotalMin = !filters.totalMin || o.total >= parseFloat(filters.totalMin);
            const matchTotalMax = !filters.totalMax || o.total <= parseFloat(filters.totalMax);

            return matchSearch && matchStatus && matchFrom && matchTo && matchTotalMin && matchTotalMax;
        });
    }, [orders, filters]);

    const hasActiveFilters: boolean =
        !!filters.search ||
        !!filters.status ||
        !!filters.dateFrom ||
        (filters.dateTo !== formatDateLocal(new Date()) && !!filters.dateTo) ||
        !!filters.totalMin ||
        !!filters.totalMax;

    const reset = () => setFilters(getInitialState());

    return { filters, setFilters, filtered, hasActiveFilters, reset };
}