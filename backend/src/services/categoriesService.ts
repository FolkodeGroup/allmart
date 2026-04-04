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
  parentId: string | null;
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

  // Usar include: { _count: { select: { products: true } } } para contar productos
  // Filtrar por cantidad de productos después de obtener los resultados
  const [total, rows] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { productCategories: true } },
      },
    }),
  ]);

  // Filtrar por minProducts y maxProducts en memoria (paginación ya aplicada)
  let filteredRows = rows;
  if (typeof minProducts === 'number') {
    filteredRows = filteredRows.filter(row => row._count.productCategories >= minProducts);
  }
  if (typeof maxProducts === 'number') {
    filteredRows = filteredRows.filter(row => row._count.productCategories <= maxProducts);
  }

  // Mapear para incluir el conteo real de productos
  const data = filteredRows.map(row =>
    toCategory({
      ...row,
      itemCount: row._count.productCategories,
    })
  );

  // El total debe reflejar el filtro de cantidad de productos
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
    toCategory({
      ...row,
      itemCount: row.parentId ? (baseCounts.get(row.id) ?? 0) : (rollupCounts.get(row.id) ?? 0),
    })
  );
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
      name: normalizedName,
      slug,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      parentId,
      isVisible: dto.isVisible !== undefined ? dto.isVisible : true,
    },
  });

  return toCategory(row);
}

export async function updateCategory(id: string, dto: UpdateCategoryDTO): Promise<Category> {
  const existing = await getCategoryById(id);

  const nextName = dto.name !== undefined ? dto.name.trim() : existing.name;
  if (dto.name !== undefined && !nextName) {
    throw createError('El nombre de la categoría es obligatorio', 400);
  }

  let newSlug = existing.slug;
  if (dto.slug && dto.slug.trim() !== '') {
    newSlug = generateSlug(dto.slug.trim());
  } else if (dto.name !== undefined) {
    newSlug = generateSlug(nextName);
  }

  if (!newSlug) {
    throw createError('No se pudo generar un slug válido para la categoría', 400);
  }

  if (newSlug !== existing.slug) {
    const conflict = await prisma.category.findUnique({ where: { slug: newSlug } });
    if (conflict) throw createError(`El slug "${newSlug}" ya está en uso`, 409);
  }

  let parentId: string | null | undefined = undefined;
  if (dto.parentId !== undefined) {
    if (dto.parentId === id) {
      throw createError('Una categoría no puede ser su propio padre', 400);
    }

    if (dto.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw createError('Categoría padre no encontrada', 404);
      }
      if (parent.parentId) {
        throw createError('Solo se permite un nivel de subcategorías', 400);
      }

      const childCount = await prisma.category.count({ where: { parentId: id } });
      if (childCount > 0) {
        throw createError('No se puede asignar padre a una categoría que ya tiene subcategorías', 400);
      }

      parentId = parent.id;
    } else {
      parentId = null;
    }
  }

  const row = await prisma.category.update({
    where: { id },
    data: {
      name: dto.name !== undefined ? nextName : existing.name,
      slug: newSlug,
      description: dto.description !== undefined ? dto.description : existing.description,
      imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : existing.imageUrl,
      parentId: parentId !== undefined ? parentId : existing.parentId,
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

