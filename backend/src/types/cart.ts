export interface CartItemDTO {
  productId: string;
  quantity: number;
  productName?: string;
  productImage?: string;
  unitPrice?: number;
}

export interface CartDTO {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItemDTO[];
  createdAt: Date;
  updatedAt: Date;
}