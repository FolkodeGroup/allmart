/**
 * models/Product.ts
 * Modelo de datos del producto base.
 * Las variantes (talle, color, etc.) se gestionan en ProductVariant.
 * Las imágenes en ProductImage.
 */

import { ProductStatus } from '../types';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;  // Precio tachado / precio original
  categoryId: string;
  status: ProductStatus;
  sku?: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductDTO = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductDTO = Partial<CreateProductDTO>;
