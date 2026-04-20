import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import {
  bulkUpdateAdminOrdersStatus,
  deleteAdminOrder,
  fetchAllAdminOrders,
  fetchAdminOrderById,
  type BulkOrderAction,
  type BulkUpdateOrdersResult,
  updateAdminOrder,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus,
} from '../features/admin/orders/ordersService';

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en-preparacion'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
}

export type PaymentStatus = 'no-abonado' | 'abonado';

export interface OrderHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  note?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paidAt?: string;
  notes?: string;
  statusHistory?: OrderHistoryEntry[];
}

// Se conserva por compatibilidad con imports legacy.
// eslint-disable-next-line react-refresh/only-export-components
export const ORDERS_STORAGE_KEY = 'allmart_orders';

interface AdminOrdersContextType {
  orders: Order[];
  isLoading: boolean;
  refreshOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus, note?: string) => Promise<void>;
  bulkUpdateOrderStatus: (payload: {
    orderIds: string[];
    action: BulkOrderAction;
    note?: string;
  }) => Promise<BulkUpdateOrdersResult>;
  updateOrder: (id: string, data: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getOrder: (id: string) => Order | undefined;
  markAsPaid: (id: string) => Promise<void>;
  getPendingOrdersCount: () => number;
}

const AdminOrdersContext = createContext<AdminOrdersContextType | undefined>(undefined);

export function AdminOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAdminAuth();

  const refreshOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchAllAdminOrders(token);
      setOrders(data);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const addOrder = useCallback(async (_order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
    throw new Error('Alta de pedidos desde admin no disponible');
  }, []);

  const updateOrderStatusHandler = useCallback(async (id: string, status: OrderStatus, note?: string) => {
    if (!token) throw new Error('No autenticado');
    const updated = await updateAdminOrderStatus(token, id, status, note);

    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, ...updated } : order)));
  }, [token]);

  const bulkUpdateOrderStatus = useCallback(async (payload: {
    orderIds: string[];
    action: BulkOrderAction;
    note?: string;
  }) => {
    if (!token) throw new Error('No autenticado');

    const result = await bulkUpdateAdminOrdersStatus(token, payload);

    const successIds = new Set(result.results.filter((r) => r.success).map((r) => r.id));
    if (successIds.size > 0) {
      const updatedOrders = await Promise.all(
        Array.from(successIds).map((id) => fetchAdminOrderById(token, id))
      );
      const updatedMap = new Map<string, Order>(
        updatedOrders.map((updatedOrder) => [updatedOrder.id, updatedOrder])
      );
      setOrders((prev) => prev.map((order) => updatedMap.get(order.id) ?? order));
    }

    return result;
  }, [token]);

  const updateOrderHandler = useCallback(async (id: string, data: Partial<Order>) => {
    if (!token) throw new Error('No autenticado');

    const payload: Partial<Pick<Order, 'status' | 'paymentStatus' | 'paidAt' | 'notes'>> = {};
    if (data.status !== undefined) payload.status = data.status;
    if (data.paymentStatus !== undefined) payload.paymentStatus = data.paymentStatus;
    if (data.paidAt !== undefined) payload.paidAt = data.paidAt;
    if (data.notes !== undefined) payload.notes = data.notes;

    const updated = await updateAdminOrder(token, id, payload);
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, ...updated } : order)));
  }, [token]);

  const deleteOrderHandler = useCallback(async (id: string) => {
    if (!token) throw new Error('No autenticado');
    await deleteAdminOrder(token, id);
    setOrders((prev) => prev.filter((order) => order.id !== id));
  }, [token]);

  const getOrder = useCallback((id: string) => orders.find((order) => order.id === id), [orders]);

  const markAsPaid = useCallback(async (id: string) => {
    if (!token) throw new Error('No autenticado');
    const updated = await updateAdminOrderPaymentStatus(token, id, 'abonado');
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, ...updated } : order)));
  }, [token]);

  const getPendingOrdersCount = useCallback(
    () => orders.filter((order) => order.status === 'pendiente').length,
    [orders]
  );

  return (
    <AdminOrdersContext.Provider
      value={{
        orders,
        isLoading,
        refreshOrders,
        addOrder,
        updateOrderStatus: updateOrderStatusHandler,
        bulkUpdateOrderStatus,
        updateOrder: updateOrderHandler,
        deleteOrder: deleteOrderHandler,
        getOrder,
        markAsPaid,
        getPendingOrdersCount,
      }}
    >
      {children}
    </AdminOrdersContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminOrders() {
  const context = useContext(AdminOrdersContext);
  if (context === undefined) {
    throw new Error('useAdminOrders must be used within AdminOrdersProvider');
  }
  return context;
}
