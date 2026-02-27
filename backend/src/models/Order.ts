/**
 * models/Order.ts
 * Modelo de pedido / venta.
 */

import { OrderStatus, PaymentStatus } from '../types';

export interface Order {
  id: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateOrderDTO = Omit<Order, 'id' | 'status' | 'paymentStatus' | 'paidAt' | 'createdAt' | 'updatedAt'>;
export type UpdateOrderDTO = Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>;
