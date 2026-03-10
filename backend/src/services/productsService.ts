/**
 * services/productsService.ts
 * Lógica de negocio para el dominio de productos usando Prisma Client.
 */

import { Decimal } from '@prisma/client/runtime/client';
import { ProductStatus as PrismaProductStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { Product, CreateProductDTO, UpdateProductDTO } from '../models/Product';
import { ProductStatus } from '../types';
import { createError } from '../middlewares/errorHandler';
import * as categoriesService from './categoriesService';
import { getCategoryBySlug } from './categoriesService';

// Función auxiliar para el slug
function generateSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

// Mapea el resultado de Prisma al tipo Product del proyecto
function toProduct(row: any): Product {
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
    categoryId: row.categoryId ?? '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    rating: row.rating.toNumber(),
    reviewCount: row.reviewCount,
    inStock: row.inStock,
    stock: row.stock,
    sku: row.sku ?? undefined,
    features: Array.isArray(row.features) ? row.features : [],
    status: row.status as ProductStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(toProduct);
}

export async function getProductById(id: string): Promise<Product> {
  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) throw createError('Producto no encontrado', 404);
  return toProduct(row);
}

export async function createProduct(dto: CreateProductDTO): Promise<Product> {
  if (!dto.name || dto.price === undefined || !dto.categoryId || !dto.sku) {
    throw createError('Campos requeridos: name, price, categoryId, sku', 400);
  }

  const skuExists = await prisma.product.findUnique({ where: { sku: dto.sku } });
  if (skuExists) throw createError(`El SKU "${dto.sku}" ya está en uso`, 409);

  // Validar que la categoría existe
  await categoriesService.getCategoryById(dto.categoryId);

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
      categoryId: dto.categoryId,
      status: (dto.status ?? ProductStatus.ACTIVE) as unknown as PrismaProductStatus,
      sku: dto.sku,
      stock: dto.stock ?? 0,
      rating: dto.rating ?? 0,
      reviewCount: dto.reviewCount ?? 0,
      inStock: dto.inStock ?? true,
      tags: Array.isArray(dto.tags) ? dto.tags : [],
      features: Array.isArray(dto.features) ? dto.features : [],
    },
  });

  return toProduct(row);
}

export async function updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
  const existing = await prisma.product.findUnique({ where: { id } });
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

  const categoryId = dto.categoryId || existing.categoryId;
  if (dto.categoryId) {
    await categoriesService.getCategoryById(dto.categoryId);
  }

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
      images: Array.isArray(dto.images) ? dto.images : existing.images,
      categoryId,
      status: dto.status ? (dto.status as unknown as PrismaProductStatus) : existing.status,
      sku: dto.sku !== undefined ? dto.sku : existing.sku,
      stock: dto.stock !== undefined ? dto.stock : existing.stock,
      rating: dto.rating !== undefined ? dto.rating : existing.rating,
      reviewCount: dto.reviewCount !== undefined ? dto.reviewCount : existing.reviewCount,
      inStock: dto.inStock !== undefined ? dto.inStock : existing.inStock,
      tags: Array.isArray(dto.tags) ? dto.tags : existing.tags,
      features: Array.isArray(dto.features) ? dto.features : existing.features,
    },
  });

  return toProduct(row);
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw createError('Producto no encontrado', 404);
  await prisma.product.delete({ where: { id } });
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

  const where: Record<string, unknown> = { status: 'active' };

  if (category) {
    const foundCategory = await getCategoryBySlug(category);
    where.categoryId = foundCategory.id;
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
  const row = await prisma.product.findUnique({ where: { slug } });
  if (!row) throw createError('Producto no encontrado', 404);
  return toProduct(row);
}

