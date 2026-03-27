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
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;  // original_price en DB
  discount?: number;
  images: string[];         // Json en DB
  categoryId: string;
  tags: string[];           // Json en DB
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  sku?: string;
  features: string[];       // Json en DB
  isFeatured: boolean;      // Nuevo campo
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductDTO = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductDTO = Partial<CreateProductDTO>;
