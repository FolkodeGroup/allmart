/**
 * services/categoriesService.ts
 * Lógica de negocio para el dominio de categorías.
 * Nota: actualmente usa almacenamiento en memoria. Cuando se integre
 * PostgreSQL, reemplazar el store por queries (Pool/ORM) sin cambiar la firma.
 */

import { v4 as uuidv4 } from 'uuid';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../models/Category';
import { createError } from '../middlewares/errorHandler';

const store: Map<string, Category> = new Map();

// ─── Consultas ─────────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  return Array.from(store.values());
}

/**
 * Devuelve categorías visibles al público.
 * Cuando se agregue el campo `status` a la BD, filtrar aquí por status = 'active'.
 */
export async function getAllActiveCategories(): Promise<Category[]> {
  return Array.from(store.values());
}

export async function getCategoryById(id: string): Promise<Category> {
  const category = store.get(id);
  if (!category) throw createError('Categoría no encontrada', 404);
  return category;
}

/** Busca una categoría por su slug único */
export async function getCategoryBySlug(slug: string): Promise<Category> {
  const category = Array.from(store.values()).find((c) => c.slug === slug);
  if (!category) throw createError('Categoría no encontrada', 404);
  return category;
}

// ─── Mutaciones ────────────────────────────────────────────────────────────────

export async function createCategory(dto: CreateCategoryDTO): Promise<Category> {
  const now = new Date();
  const category: Category = { ...dto, id: uuidv4(), itemCount: 0, createdAt: now, updatedAt: now };
  store.set(category.id, category);
  return category;
}

export async function updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
  const existing = await getCategoryById(id);
  const updated: Category = { ...existing, ...dto, updatedAt: new Date() };
  store.set(id, updated);
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!store.has(id)) throw createError('Categoría no encontrada', 404);
  store.delete(id);
}
