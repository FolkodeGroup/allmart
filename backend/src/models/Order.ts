/**
 * models/Order.ts
 * Modelo de pedido / venta.
 */

import { OrderStatus } from '../types';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: OrderStatus;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateOrderDTO = Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
export type UpdateOrderDTO = Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>;
