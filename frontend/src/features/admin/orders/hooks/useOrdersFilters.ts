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
