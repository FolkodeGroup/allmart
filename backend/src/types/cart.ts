export interface CartItemDTO {
  productId: string;
  productSkuId?: string;
  quantity: number;
  productName?: string;
  productImage?: string;
  unitPrice?: number;
  appliedDiscount?: any;
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