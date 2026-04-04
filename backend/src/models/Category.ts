/**
 * models/Category.ts
 * Modelo de datos alineado con la tabla PostgreSQL `categories`.
 * Refleja exactamente los campos de migrations/002_create_categories.sql.
 */

// ─── Entidad completa (espejo de la fila en BD) ───────────────────────────────
export interface Category {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  imageUrl:    string | null;
  parentId:    string | null;
  itemCount:   number;
  isVisible:   boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/** Datos para crear una categoría nueva (sin id ni timestamps) */
export type CreateCategoryDTO = Omit<Category, 'id' | 'itemCount' | 'createdAt' | 'updatedAt'>;

/** Actualización parcial de categoría */
export type UpdateCategoryDTO = Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>;

/** Vista pública que el frontend consume: imagen como "image", sin timestamps */
export interface PublicCategoryDTO {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  image:       string | null;
  parentId:    string | null;
  itemCount:   number;
  isVisible:   boolean;
}

/** Mapea el modelo interno al DTO público */
export function toPublicDTO(c: Category): PublicCategoryDTO {
  return {
    id:          c.id,
    name:        c.name,
    slug:        c.slug,
    description: c.description,
    image:       c.imageUrl,
    parentId:    c.parentId,
    itemCount:   c.itemCount,
    isVisible:   c.isVisible,
  };
}
