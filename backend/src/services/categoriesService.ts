/**
 * services/categoriesService.ts
 * Lógica de negocio para el dominio de categorías usando Prisma Client.
 */

import { prisma } from '../config/prisma';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../models/Category';
import { createError } from '../middlewares/errorHandler';

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

// Mapea el resultado de Prisma al tipo Category del proyecto
function toCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  itemCount: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return row;
}

// ─── Consultas ─────────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return rows.map(toCategory);
}

// Función para obtener categorías con búsqueda y paginación (Admin)
export async function getAdminCategories(query: {
  q?: string;
  page?: number;
  limit?: number;
}) {
  const { q, page = 1, limit = 10 } = query;

  const where: Record<string, any> = {};

  if (q) {
    const search = q.toLowerCase();
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: rows.map(toCategory),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAllActiveCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return rows.map(toCategory);
}

export async function getCategoryById(id: string): Promise<Category> {
  const row = await prisma.category.findUnique({ where: { id } });
  if (!row) throw createError('Categoría no encontrada', 404);
  return toCategory(row);
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  const row = await prisma.category.findUnique({ where: { slug } });
  if (!row) throw createError('Categoría no encontrada', 404);
  return toCategory(row);
}

// ─── Mutaciones ────────────────────────────────────────────────────────────────

export async function createCategory(dto: CreateCategoryDTO): Promise<Category> {
  if (!dto.name) {
    throw createError('El nombre de la categoría es obligatorio', 400);
  }

  const sourceForSlug = dto.slug && dto.slug.trim() !== '' ? dto.slug : dto.name;
  const slug = generateSlug(sourceForSlug);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    throw createError(`El slug "${slug}" ya está en uso por otra categoría`, 409);
  }

  const row = await prisma.category.create({
    data: {
      name: dto.name,
      slug,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      isVisible: dto.isVisible !== undefined ? dto.isVisible : true,
    },
  });

  return toCategory(row);
}

export async function updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
  const existing = await getCategoryById(id);

  let newSlug = existing.slug;
  if (dto.slug) {
    newSlug = generateSlug(dto.slug);
  } else if (dto.name) {
    newSlug = generateSlug(dto.name);
  }

  if (newSlug !== existing.slug) {
    const conflict = await prisma.category.findUnique({ where: { slug: newSlug } });
    if (conflict) throw createError(`El slug "${newSlug}" ya está en uso`, 409);
  }

  const row = await prisma.category.update({
    where: { id },
    data: {
      name: dto.name ?? existing.name,
      slug: newSlug,
      description: dto.description !== undefined ? dto.description : existing.description,
      imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : existing.imageUrl,
      isVisible: dto.isVisible !== undefined ? dto.isVisible : existing.isVisible,
    },
  });

  return toCategory(row);
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw createError('Categoría no encontrada', 404);
  await prisma.category.delete({ where: { id } });
}

