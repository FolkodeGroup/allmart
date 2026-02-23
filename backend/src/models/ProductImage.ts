/**
 * models/ProductImage.ts
 * Imágenes asociadas a un producto.
 * Subdominio de products.
 */

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  position: number; // Orden de visualización
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductImageDTO = Omit<ProductImage, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductImageDTO = Partial<CreateProductImageDTO>;
