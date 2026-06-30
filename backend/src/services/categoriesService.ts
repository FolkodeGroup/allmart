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

// 🟢 MAPEADOR ADAPTADO: `itemCount` se maneja como un campo virtual
function toCategory(row: any, itemCount = 0): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    parentId: row.parentId,
    itemCount, // Asignamos el valor calculado virtual
    isVisible: row.isVisible,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Consultas ─────────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return rows.map(row => toCategory(row, 0));
}

export async function getAdminCategories(query: {
  q?: string;
  page?: number;
  limit?: number;
  minProducts?: number;
  maxProducts?: number;
  isVisible?: boolean;
}) {
  const { q, page = 1, limit = 10, minProducts, maxProducts, isVisible } = query;

  const where: Record<string, any> = {};

  if (q) {
    const search = q.toLowerCase();
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (typeof isVisible === 'boolean') {
    where.isVisible = isVisible;
  }

  const rows = await prisma.category.findMany({
    where,
    orderBy: { name: 'asc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      _count: { select: { productCategories: true } },
    },
  });

  let filteredRows = rows;
  if (typeof minProducts === 'number') {
    filteredRows = filteredRows.filter(row => row._count.productCategories >= minProducts);
  }
  if (typeof maxProducts === 'number') {
    filteredRows = filteredRows.filter(row => row._count.productCategories <= maxProducts);
  }

  // Mapeamos pasándole el contador dinámico a la función toCategory
  const data = filteredRows.map(row =>
    toCategory(row, row._count.productCategories)
  );

  const filteredTotal = data.length;

  return {
    data,
    total: filteredTotal,
    page,
    limit,
    totalPages: Math.ceil(filteredTotal / limit),
  };
}

export async function getAllActiveCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { name: 'asc' },
  });

  const counts = await prisma.productCategory.groupBy({
    by: ['categoryId'],
    where: { product: { status: 'active' } },
    _count: { productId: true },
  });

  const baseCounts = new Map<string, number>();
  for (const row of counts) {
    baseCounts.set(row.categoryId, row._count.productId);
  }

  const rollupCounts = new Map(baseCounts);
  for (const row of rows) {
    if (row.parentId) {
      const childCount = baseCounts.get(row.id) ?? 0;
      rollupCounts.set(row.parentId, (rollupCounts.get(row.parentId) ?? 0) + childCount);
    }
  }

  return rows.map(row =>
    toCategory(
      row,
      row.parentId ? (baseCounts.get(row.id) ?? 0) : (rollupCounts.get(row.id) ?? 0)
    )
  );
}

export async function getCategoryById(id: string): Promise<Category> {
  const row = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { productCategories: true } } },
  });
  if (!row) throw createError('Categoría no encontrada', 404);
  return toCategory(row, row._count?.productCategories ?? 0);
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  const row = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { productCategories: true } } },
  });
  if (!row) throw createError('Categoría no encontrada', 404);
  return toCategory(row, row._count?.productCategories ?? 0);
}

// ─── Mutaciones ────────────────────────────────────────────────────────────────

export async function createCategory(dto: CreateCategoryDTO): Promise<Category> {
  const normalizedName = dto.name?.trim();
  if (!normalizedName) {
    throw createError('El nombre de la categoría es obligatorio', 400);
  }

  const sourceForSlug = dto.slug && dto.slug.trim() !== '' ? dto.slug.trim() : normalizedName;
  const slug = generateSlug(sourceForSlug);
  if (!slug) {
    throw createError('No se pudo generar un slug válido para la categoría', 400);
  }

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    throw createError(`El slug "${slug}" ya está en uso por otra categoría`, 409);
  }

  let parentId: string | null = null;
  if (dto.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: dto.parentId } });
    if (!parent) {
      throw createError('Categoría padre no encontrada', 404);
    }
    if (parent.parentId) {
      throw createError('Solo se permite un nivel de subcategorías', 400);
    }
    parentId = parent.id;
  }

  const row = await prisma.category.create({
    data: {
      name: dto.name,
      slug,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      parentId,
      isVisible: dto.isVisible,
    },
  });

  return toCategory(row, 0);
}

export async function updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { productCategories: true } } },
  });
  if (!existing) throw createError('Categoría no encontrada', 404);

  const row = await prisma.category.update({
    where: { id },
    data: {
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      parentId: dto.parentId,
      isVisible: dto.isVisible,
    },
  });

  return toCategory(row, existing._count?.productCategories ?? 0);
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw createError('Categoría no encontrada', 404);
  await prisma.category.delete({ where: { id } });
}