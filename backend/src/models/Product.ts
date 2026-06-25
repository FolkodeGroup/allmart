import { ProductStatus } from '../types';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  images: string[];         // Json en DB
  categoryId: string;       // Propiedad virtual computada
  categoryIds?: string[];
  tags: string[];           // Array obtenido dinámicamente de la relación N:M
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  sku?: string;
  features: string[];       // Array obtenido dinámicamente de la relación 1:N
  isFeatured: boolean;
  primarySupplierId?: string | null;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductDTO = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'categoryId' | 'categoryIds' | 'tags' | 'features'> & {
  categoryIds: string[];
  categoryId?: string;
  tags?: string[];
  features?: string[];
};

export type UpdateProductDTO = Partial<CreateProductDTO>;