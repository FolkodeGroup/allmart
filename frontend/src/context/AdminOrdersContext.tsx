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

export interface OrderHistoryEntry {
  status: OrderStatus;
  changedAt: string; // ISO 8601
  note?: string;
}

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
  statusHistory?: OrderHistoryEntry[];
}

/* ── Storage ────────────────────────────────────────────────────── */
export const ORDERS_STORAGE_KEY = 'allmart_orders';

/* ── Mock para demo ─────────────────────────────────────────────── */
const _d = (daysAgo: number, extraMs = 0) =>
  new Date(Date.now() - daysAgo * 86400000 - extraMs).toISOString();

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    createdAt: _d(1),
    customer: { firstName: 'Lucía', lastName: 'Fernández', email: 'lucia@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 1, unitPrice: 89990 },
      { productId: 'prod-4', productName: 'Set Completo de Baño', quantity: 2, unitPrice: 34990 },
    ],
    total: 159970,
    status: 'pendiente',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(1), note: 'Pedido recibido' },
    ],
  },
  {
    id: 'ord-002',
    createdAt: _d(3),
    customer: { firstName: 'Martín', lastName: 'Gómez', email: 'martin@ejemplo.com' },
    items: [
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 1, unitPrice: 24990 },
    ],
    total: 24990,
    status: 'confirmado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(3), note: 'Pedido recibido' },
      { status: 'confirmado', changedAt: _d(2, 3600000), note: 'Pago confirmado por WhatsApp' },
    ],
  },
  {
    id: 'ord-003',
    createdAt: _d(5),
    customer: { firstName: 'Valentina', lastName: 'Ruiz', email: 'vale@ejemplo.com' },
    items: [
      { productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 1, unitPrice: 48990 },
    ],
    total: 48990,
    status: 'enviado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(5), note: 'Pedido recibido' },
      { status: 'confirmado', changedAt: _d(4, 7200000) },
      { status: 'en-preparacion', changedAt: _d(3, 3600000), note: 'En armado de envío' },
      { status: 'enviado', changedAt: _d(2), note: 'Despachado por correo Andreani — #TR8821' },
    ],
  },
  {
    id: 'ord-004',
    createdAt: _d(10),
    customer: { firstName: 'Carlos', lastName: 'Medina', email: 'carlos@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 2, unitPrice: 89990 },
    ],
    total: 179980,
    status: 'entregado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(10), note: 'Pedido recibido' },
      { status: 'confirmado', changedAt: _d(9, 3600000) },
      { status: 'en-preparacion', changedAt: _d(8) },
      { status: 'enviado', changedAt: _d(6), note: 'Enviado por OCA' },
      { status: 'entregado', changedAt: _d(4), note: 'Confirmado por cliente' },
    ],
  },
  {
    id: 'ord-005',
    createdAt: _d(15),
    customer: { firstName: 'Sofía', lastName: 'Herrera', email: 'sofia@ejemplo.com' },
    items: [
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 1, unitPrice: 24990 },
      { productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 1, unitPrice: 48990 },
    ],
    total: 73980,
    status: 'cancelado',
    notes: 'Cliente solicitó cancelar por demora.',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(15), note: 'Pedido recibido' },
      { status: 'confirmado', changedAt: _d(14) },
      { status: 'cancelado', changedAt: _d(12), note: 'Cliente solicitó cancelar por demora.' },
    ],
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
  updateOrderStatus: (id: string, status: OrderStatus, note?: string) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrder: (id: string) => Order | undefined;
  markAsPaid: (id: string) => void;
}

const AdminOrdersContext = createContext<AdminOrdersContextType | undefined>(undefined);

export function AdminOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(loadOrders);

  const addOrder = (data: Omit<Order, 'id' | 'createdAt'>): Order => {
    const now = new Date().toISOString();
    const order: Order = {
      ...data,
      id: `ord-${Date.now()}`,
      createdAt: now,
      statusHistory: [
        { status: data.status, changedAt: now, note: 'Pedido recibido' },
      ],
    };
    setOrders(prev => {
      const next = [order, ...prev];
      saveOrders(next);
      return next;
    });
    return order;
  };

  const updateOrderStatus = (id: string, status: OrderStatus, note?: string) => {
    setOrders(prev => {
      const now = new Date().toISOString();
      const next = prev.map(o => {
        if (o.id !== id) return o;
        const entry: OrderHistoryEntry = { status, changedAt: now, ...(note ? { note } : {}) };
        return {
          ...o,
          status,
          statusHistory: [...(o.statusHistory ?? []), entry],
        };
      });
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
