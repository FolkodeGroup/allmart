// types/admin/order.ts

import { Order } from '../../models/Order';
import { OrderStatus, PaymentStatus } from '../../types';

/**
 * Query params del listado admin
 */
export interface AdminOrdersQueryDTO {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
  page?: string;
  limit?: string;
}

/**
 * Item mostrado en el detalle admin
 */
export interface AdminOrderItemDTO {
  productId: string;
  productName: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Historial de cambios de estado
 */
export interface AdminOrderStatusHistoryDTO {
  status: OrderStatus;
  changedAt: Date;
}

/**
 * Pedido completo que devuelve GET /api/admin/orders/:id
 */
export interface AdminOrderDTO extends Order {
  items: AdminOrderItemDTO[];
  statusHistory: AdminOrderStatusHistoryDTO[];
}

export type AdminBulkOrderAction = 'confirm' | 'ship' | 'cancel';

export interface AdminBulkUpdateOrderStatusDTO {
  orderIds: string[];
  action: AdminBulkOrderAction;
  note?: string;
}

export interface AdminBulkUpdateOrderStatusItemResultDTO {
  id: string;
  success: boolean;
  reason?: string;
}

export interface AdminBulkUpdateOrderStatusResultDTO {
  action: AdminBulkOrderAction;
  targetStatus: OrderStatus;
  total: number;
  success: number;
  failed: number;
  results: AdminBulkUpdateOrderStatusItemResultDTO[];
}