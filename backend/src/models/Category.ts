/**
 * models/Category.ts
 * Modelo de datos para las categorías de productos.
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string; // Para categorías anidadas (árbol de categorías ERP)
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCategoryDTO = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;
