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
  /* ── últimos 7 días ── */
  {
    id: 'ord-001', createdAt: _d(1),
    customer: { firstName: 'Lucía', lastName: 'Fernández', email: 'lucia@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 1, unitPrice: 89990 },
      { productId: 'prod-4', productName: 'Set Completo de Baño', quantity: 2, unitPrice: 34990 },
    ],
    total: 159970, status: 'pendiente',
    statusHistory: [{ status: 'pendiente', changedAt: _d(1), note: 'Pedido recibido' }],
  },
  {
    id: 'ord-002', createdAt: _d(2),
    customer: { firstName: 'Martín', lastName: 'Gómez', email: 'martin@ejemplo.com' },
    items: [{ productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 1, unitPrice: 24990 }],
    total: 24990, status: 'confirmado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(3), note: 'Pedido recibido' },
      { status: 'confirmado', changedAt: _d(2, 3600000), note: 'Pago confirmado por WhatsApp' },
    ],
  },
  {
    id: 'ord-006', createdAt: _d(2),
    customer: { firstName: 'Jorge', lastName: 'Blanco', email: 'jorge@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 1, unitPrice: 89990 },
      { productId: 'prod-5', productName: 'Sartén Antiadherente 28cm', quantity: 1, unitPrice: 19990 },
    ],
    total: 109980, status: 'en-preparacion',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(3) },
      { status: 'confirmado', changedAt: _d(2, 7200000) },
      { status: 'en-preparacion', changedAt: _d(2) },
    ],
  },
  {
    id: 'ord-007', createdAt: _d(4),
    customer: { firstName: 'Ana', lastName: 'Torres', email: 'ana@ejemplo.com' },
    items: [
      { productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 1, unitPrice: 48990 },
      { productId: 'prod-6', productName: 'Tabla de Corte Bambú', quantity: 2, unitPrice: 12990 },
    ],
    total: 74970, status: 'enviado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(5) },
      { status: 'confirmado', changedAt: _d(4, 3600000) },
      { status: 'en-preparacion', changedAt: _d(4) },
      { status: 'enviado', changedAt: _d(3) },
    ],
  },
  /* ── 8-30 días ── */
  {
    id: 'ord-003', createdAt: _d(8),
    customer: { firstName: 'Valentina', lastName: 'Ruiz', email: 'vale@ejemplo.com' },
    items: [{ productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 1, unitPrice: 48990 }],
    total: 48990, status: 'entregado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(8) },
      { status: 'confirmado', changedAt: _d(7, 7200000) },
      { status: 'en-preparacion', changedAt: _d(6) },
      { status: 'enviado', changedAt: _d(5) },
      { status: 'entregado', changedAt: _d(4) },
    ],
  },
  {
    id: 'ord-008', createdAt: _d(10),
    customer: { firstName: 'Ramón', lastName: 'Díaz', email: 'ramon@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 1, unitPrice: 89990 },
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 1, unitPrice: 24990 },
    ],
    total: 114980, status: 'entregado', paymentStatus: 'abonado',
    paidAt: _d(9),
    statusHistory: [
      { status: 'pendiente', changedAt: _d(11) },
      { status: 'confirmado', changedAt: _d(10, 3600000), note: 'Abonado por transferencia' },
      { status: 'en-preparacion', changedAt: _d(9) },
      { status: 'enviado', changedAt: _d(8) },
      { status: 'entregado', changedAt: _d(7) },
    ],
  },
  {
    id: 'ord-004', createdAt: _d(12),
    customer: { firstName: 'Carlos', lastName: 'Medina', email: 'carlos@ejemplo.com' },
    items: [{ productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 2, unitPrice: 89990 }],
    total: 179980, status: 'entregado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(12) },
      { status: 'confirmado', changedAt: _d(11, 3600000) },
      { status: 'en-preparacion', changedAt: _d(10) },
      { status: 'enviado', changedAt: _d(8), note: 'Enviado por OCA' },
      { status: 'entregado', changedAt: _d(6), note: 'Confirmado por cliente' },
    ],
  },
  {
    id: 'ord-009', createdAt: _d(14),
    customer: { firstName: 'Claudia', lastName: 'Vega', email: 'claudia@ejemplo.com' },
    items: [
      { productId: 'prod-4', productName: 'Set Completo de Baño', quantity: 1, unitPrice: 34990 },
      { productId: 'prod-6', productName: 'Tabla de Corte Bambú', quantity: 3, unitPrice: 12990 },
    ],
    total: 73960, status: 'entregado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(14) },
      { status: 'confirmado', changedAt: _d(13) },
      { status: 'enviado', changedAt: _d(12) },
      { status: 'entregado', changedAt: _d(11) },
    ],
  },
  {
    id: 'ord-010', createdAt: _d(17),
    customer: { firstName: 'Pablo', lastName: 'Soria', email: 'pablo@ejemplo.com' },
    items: [
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 2, unitPrice: 24990 },
      { productId: 'prod-5', productName: 'Sartén Antiadherente 28cm', quantity: 1, unitPrice: 19990 },
    ],
    total: 69970, status: 'entregado', paymentStatus: 'abonado',
    paidAt: _d(16),
    statusHistory: [
      { status: 'pendiente', changedAt: _d(17) },
      { status: 'confirmado', changedAt: _d(16), note: 'Pago confirmado WhatsApp' },
      { status: 'enviado', changedAt: _d(15) },
      { status: 'entregado', changedAt: _d(13) },
    ],
  },
  /* ── 31-60 días ── */
  {
    id: 'ord-005', createdAt: _d(33),
    customer: { firstName: 'Sofía', lastName: 'Herrera', email: 'sofia@ejemplo.com' },
    items: [
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 1, unitPrice: 24990 },
      { productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 1, unitPrice: 48990 },
    ],
    total: 73980, status: 'cancelado',
    notes: 'Cliente solicitó cancelar por demora.',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(33) },
      { status: 'confirmado', changedAt: _d(32) },
      { status: 'cancelado', changedAt: _d(30), note: 'Cliente solicitó cancelar por demora.' },
    ],
  },
  {
    id: 'ord-011', createdAt: _d(37),
    customer: { firstName: 'Irene', lastName: 'Castro', email: 'irene@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 1, unitPrice: 89990 },
      { productId: 'prod-4', productName: 'Set Completo de Baño', quantity: 1, unitPrice: 34990 },
    ],
    total: 124980, status: 'entregado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(37) },
      { status: 'confirmado', changedAt: _d(36) },
      { status: 'enviado', changedAt: _d(34) },
      { status: 'entregado', changedAt: _d(32) },
    ],
  },
  {
    id: 'ord-012', createdAt: _d(42),
    customer: { firstName: 'Diego', lastName: 'Molina', email: 'diego@ejemplo.com' },
    items: [{ productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 2, unitPrice: 48990 }],
    total: 97980, status: 'entregado', paymentStatus: 'abonado',
    paidAt: _d(41),
    statusHistory: [
      { status: 'pendiente', changedAt: _d(42) },
      { status: 'confirmado', changedAt: _d(41) },
      { status: 'enviado', changedAt: _d(40) },
      { status: 'entregado', changedAt: _d(38) },
    ],
  },
  {
    id: 'ord-013', createdAt: _d(47),
    customer: { firstName: 'Natalia', lastName: 'Ríos', email: 'natalia@ejemplo.com' },
    items: [
      { productId: 'prod-5', productName: 'Sartén Antiadherente 28cm', quantity: 2, unitPrice: 19990 },
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 1, unitPrice: 24990 },
    ],
    total: 64970, status: 'entregado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(47) },
      { status: 'confirmado', changedAt: _d(46) },
      { status: 'enviado', changedAt: _d(44) },
      { status: 'entregado', changedAt: _d(42) },
    ],
  },
  {
    id: 'ord-014', createdAt: _d(53),
    customer: { firstName: 'Fernando', lastName: 'Ortiz', email: 'fernando@ejemplo.com' },
    items: [{ productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 1, unitPrice: 89990 }],
    total: 89990, status: 'cancelado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(53) },
      { status: 'cancelado', changedAt: _d(52), note: 'Sin stock momentáneo' },
    ],
  },
  {
    id: 'ord-015', createdAt: _d(58),
    customer: { firstName: 'Laura', lastName: 'Suárez', email: 'laura@ejemplo.com' },
    items: [
      { productId: 'prod-4', productName: 'Set Completo de Baño', quantity: 2, unitPrice: 34990 },
      { productId: 'prod-6', productName: 'Tabla de Corte Bambú', quantity: 1, unitPrice: 12990 },
    ],
    total: 82970, status: 'entregado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(58) },
      { status: 'confirmado', changedAt: _d(57) },
      { status: 'enviado', changedAt: _d(55) },
      { status: 'entregado', changedAt: _d(53) },
    ],
  },
  /* ── 61-90 días ── */
  {
    id: 'ord-016', createdAt: _d(65),
    customer: { firstName: 'Tomás', lastName: 'Ibáñez', email: 'tomas@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 1, unitPrice: 89990 },
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 1, unitPrice: 24990 },
      { productId: 'prod-5', productName: 'Sartén Antiadherente 28cm', quantity: 1, unitPrice: 19990 },
    ],
    total: 134970, status: 'entregado', paymentStatus: 'abonado',
    paidAt: _d(64),
    statusHistory: [
      { status: 'pendiente', changedAt: _d(65) },
      { status: 'confirmado', changedAt: _d(64) },
      { status: 'enviado', changedAt: _d(62) },
      { status: 'entregado', changedAt: _d(60) },
    ],
  },
  {
    id: 'ord-017', createdAt: _d(70),
    customer: { firstName: 'Carina', lastName: 'Álvarez', email: 'carina@ejemplo.com' },
    items: [{ productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 1, unitPrice: 48990 }],
    total: 48990, status: 'entregado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(70) },
      { status: 'confirmado', changedAt: _d(69) },
      { status: 'enviado', changedAt: _d(67) },
      { status: 'entregado', changedAt: _d(65) },
    ],
  },
  {
    id: 'ord-018', createdAt: _d(75),
    customer: { firstName: 'Marcos', lastName: 'Peña', email: 'marcos@ejemplo.com' },
    items: [
      { productId: 'prod-4', productName: 'Set Completo de Baño', quantity: 3, unitPrice: 34990 },
    ],
    total: 104970, status: 'entregado', paymentStatus: 'abonado',
    paidAt: _d(74),
    statusHistory: [
      { status: 'pendiente', changedAt: _d(75) },
      { status: 'confirmado', changedAt: _d(74) },
      { status: 'enviado', changedAt: _d(72) },
      { status: 'entregado', changedAt: _d(70) },
    ],
  },
  {
    id: 'ord-019', createdAt: _d(80),
    customer: { firstName: 'Verónica', lastName: 'Campos', email: 'vero@ejemplo.com' },
    items: [
      { productId: 'prod-2', productName: 'Molinillo de Café Premium', quantity: 2, unitPrice: 24990 },
      { productId: 'prod-6', productName: 'Tabla de Corte Bambú', quantity: 2, unitPrice: 12990 },
    ],
    total: 75960, status: 'entregado',
    statusHistory: [
      { status: 'pendiente', changedAt: _d(80) },
      { status: 'confirmado', changedAt: _d(79) },
      { status: 'enviado', changedAt: _d(77) },
      { status: 'entregado', changedAt: _d(75) },
    ],
  },
  {
    id: 'ord-020', createdAt: _d(88),
    customer: { firstName: 'Roberto', lastName: 'Quiroga', email: 'roberto@ejemplo.com' },
    items: [
      { productId: 'prod-1', productName: 'Batería de Cocina Granito 5 Piezas', quantity: 1, unitPrice: 89990 },
      { productId: 'prod-3', productName: 'Set Cuchillos Design con Soporte', quantity: 1, unitPrice: 48990 },
    ],
    total: 138980, status: 'entregado', paymentStatus: 'abonado',
    paidAt: _d(87),
    statusHistory: [
      { status: 'pendiente', changedAt: _d(88) },
      { status: 'confirmado', changedAt: _d(87) },
      { status: 'enviado', changedAt: _d(85) },
      { status: 'entregado', changedAt: _d(83) },
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
