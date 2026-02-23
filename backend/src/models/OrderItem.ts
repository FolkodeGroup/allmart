/**
 * models/OrderItem.ts
 * Ítem (línea) dentro de un pedido.
 */

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productVariantId?: string;
  productName: string; // Snapshot del nombre al momento de la venta
  unitPrice: number;   // Snapshot del precio al momento de la venta
  quantity: number;
  subtotal: number;
}

export type CreateOrderItemDTO = Omit<OrderItem, 'id'>;
