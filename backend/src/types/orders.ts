// types/OrderStatus.ts
export interface CreatePublicOrderDTO {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: {
    productId: string;
    productName: string;
    productImage?: string;
    unitPrice: number;
    quantity: number;
  }[];
  total: number;
  notes?: string;
}