/**
 * services/productsService.ts
 * Lógica de negocio para el dominio de productos usando Prisma Client.
 */

import { Prisma, ProductStatus as PrismaProductStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { Product, CreateProductDTO, UpdateProductDTO } from '../models/Product';
import { ProductStatus } from '../types';
import { createError } from '../middlewares/errorHandler';
import { getCategoryBySlug } from './categoriesService';

// Función auxiliar para el slug
function generateSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

function normalizeCategoryIds(categoryId?: string, categoryIds?: string[]): string[] {
  const ids = Array.isArray(categoryIds) ? categoryIds.filter(Boolean) : [];
  if (categoryId) {
    if (!ids.includes(categoryId)) {
      ids.unshift(categoryId);
    }
  }
  return Array.from(new Set(ids));
}

async function ensureCategoriesExist(categoryIds: string[]): Promise<void> {
  if (!categoryIds.length) {
    throw createError('Debe indicar al menos una categoría', 400);
  }

  const rows = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true },
  });
  const foundIds = new Set(rows.map((row) => row.id));
  const missing = categoryIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw createError(`Categorías no encontradas: ${missing.join(', ')}`, 404);
  }
}

async function updateProductCategories(productId: string, categoryIds: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(categoryIds));

  await prisma.productCategory.deleteMany({
    where: {
      productId,
      categoryId: { notIn: uniqueIds },
    },
  });

  const existing = await prisma.productCategory.findMany({
    where: { productId, categoryId: { in: uniqueIds } },
    select: { categoryId: true },
  });
  const existingIds = new Set(existing.map((row) => row.categoryId));
  const toCreate = uniqueIds.filter((id) => !existingIds.has(id));

  if (toCreate.length > 0) {
    await prisma.productCategory.createMany({
      data: toCreate.map((categoryId) => ({ productId, categoryId })),
    });
  }
}

// Mapea el resultado de Prisma al tipo Product del proyecto
function toProduct(row: any): Product {
  const categoryIds = Array.isArray(row.productCategories)
    ? row.productCategories.map((rel: { categoryId: string }) => rel.categoryId)
    : Array.isArray(row.categoryIds)
      ? row.categoryIds
      : undefined;
  const primaryCategoryId = row.categoryId ?? (categoryIds && categoryIds.length > 0 ? categoryIds[0] : '') ?? '';

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    shortDescription: row.shortDescription ?? undefined,
    price: row.price.toNumber(),
    compareAtPrice: row.originalPrice?.toNumber(),
    discount: row.discount?.toNumber(),
    images: Array.isArray(row.images) ? row.images : [],
    categoryId: primaryCategoryId,
    categoryIds,
    tags: Array.isArray(row.tags) ? row.tags : [],
    rating: row.rating.toNumber(),
    reviewCount: row.reviewCount,
    inStock: row.inStock,
    stock: row.stock,
    sku: row.sku ?? undefined,
    features: Array.isArray(row.features) ? row.features : [],
    isFeatured: row.isFeatured ?? false,
    status: row.status as ProductStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { productCategories: { select: { categoryId: true } } },
  });
  return rows.map(toProduct);
}

export async function getProductById(id: string): Promise<Product> {
  const row = await prisma.product.findUnique({
    where: { id },
    include: { productCategories: { select: { categoryId: true } } },
  });
  if (!row) throw createError('Producto no encontrado', 404);
  
  // Sincronizar imágenes si el producto tiene imágenes en storage pero product.images está vacío
  const imagesArray = Array.isArray(row.images) ? row.images : [];
  const hasStorageImages = imagesArray.length === 0;
  if (hasStorageImages) {
    const storageImages = await prisma.productImageStorage.findMany({
      where: { productId: id },
      select: { id: true },
      orderBy: { position: 'asc' },
    });
    if (storageImages.length > 0) {
      const syncedImages = storageImages.map(img => `/api/images/products/${img.id}`);
      await prisma.product.update({
        where: { id },
        data: { images: syncedImages as any },
      });
      (row as any).images = syncedImages;
    }
  }
  
  return toProduct(row);
}

export async function createProduct(dto: CreateProductDTO): Promise<Product> {
  const normalizedCategoryIds = normalizeCategoryIds(dto.categoryId, dto.categoryIds);
  if (!dto.name || dto.price === undefined || !dto.sku || normalizedCategoryIds.length === 0) {
    throw createError('Campos requeridos: name, price, categoryId o categoryIds, sku', 400);
  }

  const skuExists = await prisma.product.findUnique({ where: { sku: dto.sku } });
  if (skuExists) throw createError(`El SKU "${dto.sku}" ya está en uso`, 409);

  await ensureCategoriesExist(normalizedCategoryIds);
  const primaryCategoryId = dto.categoryId ?? normalizedCategoryIds[0];

  const slug = generateSlug(dto.name);

  const row = await prisma.product.create({
    data: {
      name: dto.name,
      slug,
      description: dto.description ?? null,
      shortDescription: dto.shortDescription ?? null,
      price: dto.price,
      originalPrice: dto.compareAtPrice ?? null,
      discount: dto.discount ?? null,
      images: Array.isArray(dto.images) ? dto.images : [],
      categoryId: primaryCategoryId,
      status: (dto.status ?? ProductStatus.ACTIVE) as unknown as PrismaProductStatus,
      sku: dto.sku,
      stock: dto.stock ?? 0,
      rating: dto.rating ?? 0,
      reviewCount: dto.reviewCount ?? 0,
      inStock: dto.inStock ?? true,
      tags: Array.isArray(dto.tags) ? dto.tags : [],
      features: Array.isArray(dto.features) ? dto.features : [],
      isFeatured: dto.isFeatured ?? false,
    },
  });

  await updateProductCategories(row.id, normalizedCategoryIds);
  const refreshed = await prisma.product.findUnique({
    where: { id: row.id },
    include: { productCategories: { select: { categoryId: true } } },
  });

  return toProduct(refreshed ?? row);
}

export async function updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { productCategories: { select: { categoryId: true } } },
  });
  if (!existing) throw createError('Producto no encontrado', 404);

  if (dto.sku && dto.sku !== existing.sku) {
    const skuExists = await prisma.product.findFirst({
      where: { sku: dto.sku, id: { not: id } },
    });
    if (skuExists) throw createError(`El SKU "${dto.sku}" ya está en uso por otro producto`, 409);
  }

  let slug = existing.slug;
  if (dto.name) {
    slug = generateSlug(dto.name);
  }

  const existingCategoryIds = existing.productCategories.length > 0
    ? existing.productCategories.map((rel) => rel.categoryId)
    : (existing.categoryId ? [existing.categoryId] : []);

  const shouldUpdateCategories = dto.categoryId !== undefined || dto.categoryIds !== undefined;
  const normalizedCategoryIds = shouldUpdateCategories
    ? normalizeCategoryIds(dto.categoryId ?? existing.categoryId ?? undefined, dto.categoryIds)
    : existingCategoryIds;

  if (shouldUpdateCategories) {
    await ensureCategoriesExist(normalizedCategoryIds);
  }

  const primaryCategoryId = (dto.categoryId ?? normalizedCategoryIds[0] ?? existing.categoryId) ?? '';

  const row = await prisma.product.update({
    where: { id },
    data: {
      name: dto.name ?? existing.name,
      slug,
      description: dto.description !== undefined ? dto.description : existing.description,
      shortDescription: dto.shortDescription !== undefined ? dto.shortDescription : existing.shortDescription,
      price: dto.price ?? existing.price,
      originalPrice: dto.compareAtPrice !== undefined ? dto.compareAtPrice : existing.originalPrice,
      discount: dto.discount !== undefined ? dto.discount : existing.discount,
      images: Array.isArray(dto.images) ? dto.images : (existing.images ?? Prisma.JsonNull),
      categoryId: primaryCategoryId,
      status: dto.status ? (dto.status as unknown as PrismaProductStatus) : existing.status,
      sku: dto.sku !== undefined ? dto.sku : existing.sku,
      stock: dto.stock !== undefined ? dto.stock : existing.stock,
      rating: dto.rating !== undefined ? dto.rating : existing.rating,
      reviewCount: dto.reviewCount !== undefined ? dto.reviewCount : existing.reviewCount,
      // Si el admin actualiza stock, sincronizar inStock automáticamente
      // (explícito > derivado del stock > valor actual)
      inStock: dto.inStock !== undefined
        ? dto.inStock
        : dto.stock !== undefined
          ? dto.stock > 0
          : existing.inStock,
      tags: Array.isArray(dto.tags) ? dto.tags : (existing.tags ?? Prisma.JsonNull),
      features: Array.isArray(dto.features) ? dto.features : (existing.features ?? Prisma.JsonNull),
      isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : existing.isFeatured,
    },
  });

  if (shouldUpdateCategories) {
    await updateProductCategories(id, normalizedCategoryIds);
  }
  const refreshed = await prisma.product.findUnique({
    where: { id },
    include: { productCategories: { select: { categoryId: true } } },
  });

  return toProduct(refreshed ?? row);
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw createError('Producto no encontrado', 404);
  await prisma.product.delete({ where: { id } });
}

// Función para obtener productos con búsqueda y paginación (Admin)
export async function getAdminProducts(query: {
  q?: string;
  categoryId?: string;
  status?: string;
  stockLevel?: string;
  page?: number;
  limit?: number;
}) {
  const { q, categoryId, status, stockLevel, page = 1, limit = 10 } = query;

  const where: Record<string, any> = {};

  if (categoryId) {
    where.productCategories = { some: { categoryId } };
  }

  if (status && status !== 'all') {
    where.status = status;
  }

  if (stockLevel && stockLevel !== 'all') {
    if (stockLevel === 'no_stock') {
      where.stock = 0;
    } else if (stockLevel === 'low_stock') {
      where.stock = { gt: 0, lte: 5 };
    } else if (stockLevel === 'in_stock') {
      where.stock = { gt: 5 };
    }
  }

  if (q) {
    const search = q.toLowerCase();
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        price: true,
        originalPrice: true,
        discount: true,
        images: true,
        categoryId: true,
        tags: true,
        rating: true,
        reviewCount: true,
        inStock: true,
        stock: true,
        sku: true,
        features: true,
        isFeatured: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        productCategories: { select: { categoryId: true } },
      },
    }),
  ]);

  // Sincronizar imágenes para productos que tienen storage pero producto.images está vacío
  for (const row of rows) {
    const imagesArray = Array.isArray(row.images) ? row.images : [];
    if (imagesArray.length === 0) {
      const storageImages = await prisma.productImageStorage.findMany({
        where: { productId: row.id },
        select: { id: true },
        orderBy: { position: 'asc' },
      });
      if (storageImages.length > 0) {
        const syncedImages = storageImages.map(img => `/api/images/products/${img.id}`);
        await prisma.product.update({
          where: { id: row.id },
          data: { images: syncedImages as any },
        });
        (row as any).images = syncedImages;
      }
    }
  }

  return {
    data: rows.map(toProduct),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Función para obtener productos del catálogo (con filtros)
type ProductQuery = {
  category?: string;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
};

export async function getPublicProducts(query: ProductQuery) {
  const { category, q, sort, page = 1, limit = 12 } = query;

  const where: Record<string, unknown> = { status: 'active', stock: { gt: 0 } };

  if (category) {
    const foundCategory = await getCategoryBySlug(category);
    const children = await prisma.category.findMany({
      where: { parentId: foundCategory.id },
      select: { id: true },
    });
    const categoryIds = [foundCategory.id, ...children.map((child) => child.id)];
    where.productCategories = { some: { categoryId: { in: categoryIds } } };
  }

  if (q) {
    const search = q.toLowerCase();
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Record<string, string> = {};
  switch (sort) {
    case 'price_asc':   orderBy.price = 'asc';  break;
    case 'price_desc':  orderBy.price = 'desc'; break;
    case 'rating':      orderBy.rating = 'desc'; break;
    case 'newest':
    default:            orderBy.createdAt = 'desc';
  }

  const [total, rows] = await Promise.all([
    prisma.product.count({ where: where as never }),
    prisma.product.findMany({
      where: where as never,
      orderBy: orderBy as never,
      skip: (page - 1) * limit,
      take: limit,
      include: { productCategories: { select: { categoryId: true } } },
    }),
  ]);

  return {
    data: rows.map(toProduct),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const row = await prisma.product.findUnique({
    where: { slug },
    include: { productCategories: { select: { categoryId: true } } },
  });
  if (!row) throw createError('Producto no encontrado', 404);
  return toProduct(row);
}

