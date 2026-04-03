import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { fetchAdminOrders, mapApiOrderToOrder } from '../ordersService';
import type { Order, OrderStatus } from '../../../../context/AdminOrdersContext';

export function useOrders(token: string | undefined, filters: {
  search: string;
  status: OrderStatus | '';
  dateFrom: string;
  dateTo: string;
}) {
  const PAGE_SIZE = 10;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Debounced search
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [filters.search]);

  // Reset list on filters
  useEffect(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
  }, [debouncedSearch, filters.status, filters.dateFrom, filters.dateTo]);

  // Fetch paginated
  const abortRef = useRef<AbortController | null>(null);
  const fetchOrders = useCallback(async (reset = false) => {
    if (!token) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const params: any = {
        page,
        limit: PAGE_SIZE,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.from = filters.dateFrom;
      if (filters.dateTo) params.to = filters.dateTo;
      const res = await fetchAdminOrders(token, params);
      setHasMore(res.data.length === PAGE_SIZE);
      const normalized = res.data.map(mapApiOrderToOrder);
      setOrders(prev => reset ? normalized : [...prev, ...normalized]);
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error('Error al cargar pedidos');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [token, page, PAGE_SIZE, debouncedSearch, filters.status, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.status, filters.dateFrom, filters.dateTo, token]);

  // Load more
  const handleLoadMore = useCallback(() => {
    setPage(p => p + 1);
  }, []);
  useEffect(() => {
    if (page === 1) return;
    fetchOrders(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Selection helpers
  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const clearSelection = useCallback(() => setSelectedIds([]), []);

  // Summary
  const summary = useMemo(() => {
    return ['pendiente', 'confirmado', 'en-preparacion', 'enviado', 'entregado', 'cancelado'].reduce((acc, s) => {
      acc[s as OrderStatus] = orders.filter(o => o.status === s).length;
      return acc;
    }, {} as Record<OrderStatus, number>);
  }, [orders]);
  const totalAbonados = useMemo(() => orders.filter(o => o.paymentStatus === 'abonado').length, [orders]);

  return {
    orders,
    isLoading,
    isLoadingMore,
    hasMore,
    page,
    selectedIds,
    setSelectedIds,
    handleSelectOne,
    clearSelection,
    handleLoadMore,
    summary,
    totalAbonados,
  };
}
