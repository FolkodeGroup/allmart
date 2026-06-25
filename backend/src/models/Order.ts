/**
 * models/Order.ts
 * Modelo de pedido / venta.
 */

import { OrderStatus, PaymentStatus } from '../types';

export interface Order {
  id: string;
  customerId?: string; // Vínculo fuerte al cliente CRM
  createdAt: Date;
  updatedAt: Date;
  // Snapshot inmutable
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  notes?: string;
  items?: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    unitPrice: number;
    quantity: number;
  }>;
  statusHistory?: Array<{
    status: OrderStatus;
    changedAt: Date;
    note?: string;
  }>;
}

export type CreateOrderDTO = {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  total: number;
  notes?: string;
};

export type UpdateOrderDTO = Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'customer'>>;