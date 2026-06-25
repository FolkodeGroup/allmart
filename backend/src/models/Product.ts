import { ProductStatus } from '../types';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  images: string[];         // Json en DB
  categoryId: string;       // Propiedad computada (virtual) para compatibilidad
  categoryIds: string[];    // Array real de categorías (Single Source of Truth)
  tags: string[];           // Json en DB
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stock: number;
  sku?: string;
  features: string[];       // Json en DB
  isFeatured: boolean;
  primarySupplierId?: string | null;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** DTO para la creación de productos */
export type CreateProductDTO = Omit<
  Product, 
  'id' | 'createdAt' | 'updatedAt' | 'categoryId' | 'categoryIds'
> & {
  categoryIds: string[]; // Requerido en la entrada para asociar categorías
  categoryId?: string;   // Opcional por compatibilidad heredada
};

/** DTO para la actualización de productos */
export type UpdateProductDTO = Partial<CreateProductDTO>;