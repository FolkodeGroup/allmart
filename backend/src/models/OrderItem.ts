/**
 * models/OrderItem.ts
 * Ítem (línea) dentro de un pedido.
 */

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
}

export type CreateOrderItemDTO = Omit<OrderItem, 'id'>;
