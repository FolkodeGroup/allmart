/**
 * models/ProductVariant.ts
 * Variante de producto: combinación de atributos (color, talle, material, etc.)
 * Subdominio de products.
 */

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>; // { color: 'rojo', talle: 'M' }
  price?: number;                      // Si difiere del precio base
  stock: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductVariantDTO = Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductVariantDTO = Partial<CreateProductVariantDTO>;
