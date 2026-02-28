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
  total: number;
  createdAt: Date;
  updatedAt: Date;
}