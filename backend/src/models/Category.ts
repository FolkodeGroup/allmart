/**
 * models/Category.ts
 * Modelo de datos para las categorías de productos.
 */

import { CategoryStatus } from '../types/enums';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  itemCount: number;
  status: CategoryStatus;
  parentId?: string; // Para categorías anidadas (árbol de categorías ERP)
  createdAt: Date;
  updatedAt: Date;
}

// ─── DTOs públicos ─────────────────────────────────────────────────────────────
/** Forma que el frontend consume: nombres camelCase, imagen como "image" */
export interface PublicCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  itemCount: number;
}

/** Mapea el modelo interno al DTO público */
export function toPublicDTO(c: Category): PublicCategoryDTO {
  return {
    id:          c.id,
    name:        c.name,
    slug:        c.slug,
    description: c.description,
    image:       c.imageUrl,
    itemCount:   c.itemCount,
  };
}

export type CreateCategoryDTO = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;
