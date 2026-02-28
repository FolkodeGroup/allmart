/**
 * models/Order.ts
 * Modelo de pedido / venta.
 */

import { OrderStatus, PaymentStatus } from '../types';

export interface Order {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  notes?: string;
}

export type CreateOrderDTO = {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  total: number;
  notes?: string;
};
export type UpdateOrderDTO = Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'customer'>>;
