import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

/* ── Tipos ─────────────────────────────────────────────────────── */
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

export interface Order {
  id: string;
  createdAt: string; // ISO 8601
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paidAt?: string; // ISO 8601
  notes?: string;
}

/* ── Storage ────────────────────────────────────────────────────── */
export const ORDERS_STORAGE_KEY = 'allmart_orders';

/* ── Mock para demo ─────────────────────────────────────────────── */
const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    customer: { firstName: 'Lucía', lastName: 'Fernández', email: 'lucia@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 1, unitPrice: 89990 },
      { productId: 'prod-4', productName: 'Set Completo de Baño', quantity: 2, unitPrice: 34990 },
    ],
    total: 159970,
    status: 'pendiente',
  },
  {
    id: 'ord-002',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    customer: { firstName: 'Martín', lastName: 'Gómez', email: 'martin@ejemplo.com' },
    items: [
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 1, unitPrice: 24990 },
    ],
    total: 24990,
    status: 'confirmado',
  },
  {
    id: 'ord-003',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    customer: { firstName: 'Valentina', lastName: 'Ruiz', email: 'vale@ejemplo.com' },
    items: [
      { productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 1, unitPrice: 48990 },
    ],
    total: 48990,
    status: 'enviado',
  },
  {
    id: 'ord-004',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    customer: { firstName: 'Carlos', lastName: 'Medina', email: 'carlos@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 2, unitPrice: 89990 },
    ],
    total: 179980,
    status: 'entregado',
  },
  {
    id: 'ord-005',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    customer: { firstName: 'Sofía', lastName: 'Herrera', email: 'sofia@ejemplo.com' },
    items: [
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 1, unitPrice: 24990 },
      { productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 1, unitPrice: 48990 },
    ],
    total: 73980,
    status: 'cancelado',
    notes: 'Cliente solicitó cancelar por demora.',
  },
];

function loadOrders(): Order[] {
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return MOCK_ORDERS;
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

/* ── Context ────────────────────────────────────────────────────── */
interface AdminOrdersContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrder: (id: string) => Order | undefined;
  markAsPaid: (id: string) => void;
}

const AdminOrdersContext = createContext<AdminOrdersContextType | undefined>(undefined);

export function AdminOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(loadOrders);

  const addOrder = (data: Omit<Order, 'id' | 'createdAt'>): Order => {
    const order: Order = {
      ...data,
      id: `ord-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => {
      const next = [order, ...prev];
      saveOrders(next);
      return next;
    });
    return order;
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === id ? { ...o, status } : o);
      saveOrders(next);
      return next;
    });
  };

  const updateOrder = (id: string, data: Partial<Order>) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === id ? { ...o, ...data } : o);
      saveOrders(next);
      return next;
    });
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => {
      const next = prev.filter(o => o.id !== id);
      saveOrders(next);
      return next;
    });
  };

  const getOrder = (id: string) => orders.find(o => o.id === id);

  const markAsPaid = (id: string) => {
    setOrders(prev => {
      const next = prev.map(o =>
        o.id === id
          ? { ...o, paymentStatus: 'abonado' as PaymentStatus, paidAt: new Date().toISOString() }
          : o
      );
      saveOrders(next);
      return next;
    });
  };

  return (
    <AdminOrdersContext.Provider value={{
      orders, addOrder, updateOrderStatus, updateOrder, deleteOrder, getOrder, markAsPaid,
    }}>
      {children}
    </AdminOrdersContext.Provider>
  );
}

export function useAdminOrders() {
  const ctx = useContext(AdminOrdersContext);
  if (!ctx) throw new Error('useAdminOrders must be used within AdminOrdersProvider');
  return ctx;
}
