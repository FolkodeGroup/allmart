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
  itemCount:   number;
  createdAt:   Date;
  updatedAt:   Date;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/** Datos para crear una categoría nueva (sin id ni timestamps) */
export type CreateCategoryDTO = Omit<Category, 'id' | 'itemCount' | 'createdAt' | 'updatedAt'>;

/** Actualización parcial de categoría */
export type UpdateCategoryDTO = Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>;

/** Vista pública de categoría (para el frontend) */
export type PublicCategory = Omit<Category, 'createdAt' | 'updatedAt'>;
