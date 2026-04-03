import { useState } from 'react';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';

export function useOrdersFilters() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return {
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    clearFilters,
  };
}
// hooks/useOrdersFilters.ts
import { useState, useMemo } from 'react';
import type { Order } from '../../../../context/AdminOrdersContext';

export interface OrdersFiltersState {
    search: string;
    statuses: string[];
    dateFrom: string;
    dateTo: string;
    totalMin: string;
    totalMax: string;
}

const INITIAL: OrdersFiltersState = {
    search: '',
    statuses: [],
    dateFrom: '',
    dateTo: '',
    totalMin: '',
    totalMax: '',
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
            const matchTotalMin = !filters.totalMin || o.total >= parseFloat(filters.totalMin);
            const matchTotalMax = !filters.totalMax || o.total <= parseFloat(filters.totalMax);

            return matchSearch && matchStatus && matchFrom && matchTo && matchTotalMin && matchTotalMax;
        });
    }, [orders, filters]);

    const hasActiveFilters =
        !!filters.search ||
        filters.statuses.length > 0 ||
        !!filters.dateFrom ||
        !!filters.dateTo ||
        !!filters.totalMin ||
        !!filters.totalMax;

    const reset = () => setFilters(INITIAL);

    return { filters, setFilters, filtered, hasActiveFilters, reset };
}
