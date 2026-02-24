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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
  if (!dto.name) {
    throw createError('El nombre de la categoría es obligatorio', 400);
  }
  const now = new Date();
  const slug = generateSlug(dto.name);
  const category: Category = { ...dto, slug, id: uuidv4(), itemCount: 0, createdAt: now, updatedAt: now };
  store.set(category.id, category);
  return category;
}

export async function updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
  const existing = await getCategoryById(id);

  let slug = existing.slug;

  if (dto.slug) {
    slug = dto.slug;
  } else if (dto.name) {
    slug = generateSlug(dto.name);
  }

  const updated: Category = { ...existing, ...dto, slug, updatedAt: new Date() };
  store.set(id, updated);
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!store.has(id)) throw createError('Categoría no encontrada', 404);
  store.delete(id);
}
