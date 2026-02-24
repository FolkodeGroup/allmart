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
  

  // Validamos que si no se pasa slug, se genere uno a partir del nombre.
  const sourceForSlug = dto.slug && dto.slug.trim() !== '' ? dto.slug : dto.name;
  const slug = generateSlug(sourceForSlug);

  const existingCategories = Array.from(store.values());
  const isSlugTaken = existingCategories.some(cat => cat.slug === slug);

  if (isSlugTaken) {
    // Opción A: Lanzar un error (Lo más común en APIs estrictas)
    throw createError(`El slug "${slug}" ya está en uso por otra categoría`, 409);
  }

  const now = new Date();

  const category: Category = { ...dto, slug, id: uuidv4(), itemCount: 0, createdAt: now, updatedAt: now };
  store.set(category.id, category);
  return category;
}

export async function updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
  const existing = await getCategoryById(id);

// 1. Decidir el nuevo slug
  let newSlug = existing.slug;
  if (dto.slug) {
    newSlug = generateSlug(dto.slug);
  } else if (dto.name) {
    newSlug = generateSlug(dto.name);
  }

  // 2. VALIDACIÓN DE UNICIDAD (Solo si el slug cambió)
  if (newSlug !== existing.slug) {
    const isSlugTaken = Array.from(store.values()).some(cat => cat.slug === newSlug);
    if (isSlugTaken) {
      throw createError(`El slug "${newSlug}" ya está en uso`, 409);
    }
  }

  const updated: Category = { ...existing, ...dto, slug:newSlug, updatedAt: new Date() };
  store.set(id, updated);
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!store.has(id)) throw createError('Categoría no encontrada', 404);
  store.delete(id);
}
