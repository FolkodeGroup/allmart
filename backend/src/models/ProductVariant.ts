/**
 * models/ProductVariant.ts
 * Variante de producto: combinación de atributos (color, talle, material, etc.)
 * Subdominio de products.
 */

export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // Ej: "Color", "Talle"
  values: string[]; // Ej: ["Rojo", "Azul"]
  isActive: boolean; // Estado activo/inactivo
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductVariantDTO = Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductVariantDTO = Partial<Omit<CreateProductVariantDTO, 'productId'>>;
