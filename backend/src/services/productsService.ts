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
import { parseSafePrice } from './productSkusService';

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

async function updateProductTags(productId: string, tags: string[]): Promise<void> {
  const uniqueTags = Array.from(new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean)));

  // 1. Desvincular tags que no correspondan
  await prisma.productTag.deleteMany({
    where: {
      productId,
      tag: { name: { notIn: uniqueTags } }
    }
  });

  // 2. Insertar/Vincular los nuevos
  for (const tagName of uniqueTags) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    });

    await prisma.productTag.upsert({
      where: {
        productId_tagId: { productId, tagId: tag.id }
      },
      update: {},
      create: { productId, tagId: tag.id }
    });
  }
}

async function updateProductFeatures(productId: string, features: string[]): Promise<void> {
  // Limpiar features existentes para este producto
  await prisma.productFeature.deleteMany({ where: { productId } });

  // Insertar nuevas features respetando el orden
  if (features.length > 0) {
    await prisma.productFeature.createMany({
      data: features.map((desc, idx) => ({
        productId,
        description: desc.trim(),
        displayOrder: idx
      }))
    });
  }
}

// Mapea el resultado de Prisma al tipo Product del proyecto
function toProduct(row: any): Product {
  const categoryIds = Array.isArray(row.productCategories)
    ? row.productCategories.map((rel: { categoryId: string }) => rel.categoryId)
    : Array.isArray(row.categoryIds)
      ? row.categoryIds
      : [];
  
  const primaryCategoryId = categoryIds[0] ?? '';

  // Reconstruimos tags desde la relación N:M
  const tags = Array.isArray(row.productTags)
    ? row.productTags.map((pt: any) => pt.tag.name)
    : [];

  // Reconstruimos features desde la relación 1:N
  const features = Array.isArray(row.productFeatures)
    ? row.productFeatures.map((pf: any) => pf.description)
    : [];

  // Extraemos las imágenes desde la relación directa en BD
  const images = Array.isArray(row.productImages)
    ? row.productImages.map((img: any) => `/api/images/products/${img.id}`)
    : [];

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    shortDescription: row.shortDescription ?? undefined,
    price: row.price.toNumber(),
    images,
    categoryId: primaryCategoryId,
    categoryIds,
    tags,
    rating: row.rating.toNumber(),
    reviewCount: row.reviewCount,
    inStock: row.inStock,
    stock: row.stock,
    sku: row.sku ?? undefined,
    features,
    isFeatured: row.isFeatured ?? false,
    primarySupplierId: row.primarySupplierId ?? null,
    status: row.status as ProductStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const adminProductSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  shortDescription: true,
  price: true,
  productImages: { select: { id: true }, orderBy: { position: 'asc' } },
  rating: true,
  reviewCount: true,
  inStock: true,
  stock: true,
  sku: true,
  isFeatured: true,
  primarySupplierId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  productCategories: { select: { categoryId: true } },
  productTags: { select: { tag: { select: { name: true } } } },
  productFeatures: { select: { description: true, displayOrder: true }, orderBy: { displayOrder: 'asc' } },
} satisfies Prisma.ProductSelect;

type AdminProductsFilterQuery = {
  q?: string;
  categoryId?: string;
  status?: string;
  stockLevel?: string;
  productIds?: string[];
};

function buildAdminProductsWhere(query: AdminProductsFilterQuery): Record<string, any> {
  const { q, categoryId, status, stockLevel, productIds } = query;
  const where: Record<string, any> = {};

  if (Array.isArray(productIds) && productIds.length > 0) {
    where.id = { in: productIds };
  }

  if (categoryId) {
    where.productCategories = { some: { categoryId } };
  }

  if (status && status !== 'all') {
    where.status = status;
  } else {
    // Si no se filtra por un estado en particular, excluimos los archivados
    where.status = { not: 'archived' }; 
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

  return where;
}

export async function checkProductExists(id: string): Promise<boolean> {
  const count = await prisma.product.count({
    where: { id },
  });
  return count > 0;
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      productImages: { select: { id: true }, orderBy: { position: 'asc' } },
      productCategories: { select: { categoryId: true } },
      productTags: { include: { tag: true } },
      productFeatures: { orderBy: { displayOrder: 'asc' } },
    },
  });
  return rows.map(toProduct);
}

export async function getProductById(id: string): Promise<Product> {
  const row = await prisma.product.findUnique({
    where: { id },
    include: {
      productImages: { select: { id: true }, orderBy: { position: 'asc' } },
      productCategories: { select: { categoryId: true } },
      productTags: { include: { tag: true } },
      productFeatures: { orderBy: { displayOrder: 'asc' } },
      productOptions: {
        where: { isActive: true },
        include: {
          values: true
        }
      },
      productSkus: {
        where: { isActive: true },
        include: {
          skuValues: {
            include: {
              optionValue: {
                include: {
                  option: true
                }
              }
            }
          },
          productSkuImages: {
            select: { id: true }
          }
        }
      }
    },
  });
  
  if (!row) throw createError('Producto no encontrado', 404);

  const base = toProduct(row);

  const variants = (row as any).productOptions?.map((opt: any) => ({
    id: opt.id,
    name: opt.name,
    values: opt.values?.map((val: any) => val.name) ?? [],
  })) ?? [];
  (base as any).variants = variants;

  if (Array.isArray((row as any).productSkus)) {
    const skus = (row as any).productSkus.map((s: any) => {
      const attributes: Record<string, string> = {};
      if (Array.isArray(s.skuValues)) {
        for (const sv of s.skuValues) {
          if (sv.optionValue && sv.optionValue.option) {
            attributes[sv.optionValue.option.name] = sv.optionValue.name;
          }
        }
      }

      const images = Array.isArray(s.productSkuImages) && s.productSkuImages.length > 0
        ? s.productSkuImages.map((img: any) => `/api/images/sku/${img.id}`)
        : base.images;

      return {
        id: s.id,
        sku: s.sku,
        attributes,
        images,
        stock: s.stock,
        price: s.price !== null && s.price !== undefined ? Number(s.price) : Number(row.price),
        isActive: s.isActive,
      };
    });
    (base as any).skus = skus;
  }

  return base;
}

export async function createProduct(dto: CreateProductDTO): Promise<Product> {
  const normalizedCategoryIds = normalizeCategoryIds(dto.categoryId, dto.categoryIds);
  if (!dto.name || dto.price === undefined || !dto.sku || normalizedCategoryIds.length === 0) {
    throw createError('Campos requeridos: name, price, categoryId o categoryIds, sku', 400);
  }

  const skuExists = await prisma.product.findUnique({ where: { sku: dto.sku } });
  if (skuExists) throw createError('El SKU ya está en uso', 409, ['sku']);

  await ensureCategoriesExist(normalizedCategoryIds);

  const slug = generateSlug(dto.name);
  const parsedPrice = parseSafePrice(dto.price) ?? 0;

  const row = await prisma.product.create({
    data: {
      name: dto.name,
      slug,
      description: dto.description ?? null,
      shortDescription: dto.shortDescription ?? null,
      price: parsedPrice,
      status: (dto.status ?? ProductStatus.ACTIVE) as unknown as PrismaProductStatus,
      sku: dto.sku,
      stock: dto.stock ?? 0,
      rating: dto.rating ?? 0,
      reviewCount: dto.reviewCount ?? 0,
      inStock: dto.inStock ?? true,
      isFeatured: dto.isFeatured ?? false,
      ...(dto.primarySupplierId !== undefined
        ? { primarySupplierId: dto.primarySupplierId ?? null }
        : {}),
    },
  });

  await updateProductCategories(row.id, normalizedCategoryIds);
  await updateProductTags(row.id, Array.isArray(dto.tags) ? dto.tags : []);
  await updateProductFeatures(row.id, Array.isArray(dto.features) ? dto.features : []);

  const refreshed = await prisma.product.findUnique({
    where: { id: row.id },
    include: {
      productImages: { select: { id: true }, orderBy: { position: 'asc' } },
      productCategories: { select: { categoryId: true } },
      productTags: { include: { tag: true } },
      productFeatures: { orderBy: { displayOrder: 'asc' } },
    },
  });

  return toProduct(refreshed ?? row);
}

export async function updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { 
      productCategories: { select: { categoryId: true } },
      productSkus: { where: { isActive: true } },
      productTags: { include: { tag: true } }
    },
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
    : [];

  const shouldUpdateCategories = dto.categoryId !== undefined || dto.categoryIds !== undefined;
  const normalizedCategoryIds = shouldUpdateCategories
    ? normalizeCategoryIds(dto.categoryId ?? undefined, dto.categoryIds)
    : existingCategoryIds;

  if (shouldUpdateCategories) {
    await ensureCategoriesExist(normalizedCategoryIds);
  }

  let finalPrice = dto.price !== undefined ? parseSafePrice(dto.price) : undefined;
  if (finalPrice !== undefined && existing.productSkus.length > 0) {
    const skuPrices = existing.productSkus
      .map((s) => s.price ? Number(s.price) : null)
      .filter((p): p is number => p !== null && p > 0);

    if (skuPrices.includes(Number(finalPrice)) && Number(finalPrice) !== Number(existing.price)) {
      finalPrice = Number(existing.price);
    }
  }

  const row = await prisma.product.update({
    where: { id },
    data: {
      name: dto.name ?? existing.name,
      slug,
      description: dto.description !== undefined ? dto.description : existing.description,
      shortDescription: dto.shortDescription !== undefined ? dto.shortDescription : existing.shortDescription,
      price: finalPrice !== undefined ? finalPrice : existing.price,
      status: dto.status ? (dto.status as unknown as PrismaProductStatus) : existing.status,
      sku: dto.sku !== undefined ? dto.sku : existing.sku,
      stock: dto.stock !== undefined ? dto.stock : existing.stock,
      rating: dto.rating !== undefined ? dto.rating : existing.rating,
      reviewCount: dto.reviewCount !== undefined ? dto.reviewCount : existing.reviewCount,
      inStock: dto.inStock !== undefined
        ? dto.inStock
        : dto.stock !== undefined
          ? dto.stock > 0
          : existing.inStock,
      novedadSince: (() => {
        const incomingTags = Array.isArray(dto.tags) ? dto.tags : null;
        if (incomingTags === null) return undefined;

        const teniaNovedad = existing.productTags.some(pt => pt.tag.name === 'novedad');
        const tieneNovedad = incomingTags.includes('novedad');

        if (tieneNovedad && !teniaNovedad) {
          return new Date();
        }
        if (!tieneNovedad) {
          return null;
        }
        return undefined;
      })(),
      isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : existing.isFeatured,
      ...(dto.primarySupplierId !== undefined
        ? { primarySupplierId: dto.primarySupplierId ?? null }
        : {}),
    },
  });

  if (shouldUpdateCategories) {
    await updateProductCategories(id, normalizedCategoryIds);
  }
  if (dto.tags !== undefined) {
    await updateProductTags(id, Array.isArray(dto.tags) ? dto.tags : []);
  }
  if (dto.features !== undefined) {
    await updateProductFeatures(id, Array.isArray(dto.features) ? dto.features : []);
  }

  const refreshed = await prisma.product.findUnique({
    where: { id },
    include: {
      productImages: { select: { id: true }, orderBy: { position: 'asc' } },
      productCategories: { select: { categoryId: true } },
      productTags: { include: { tag: true } },
      productFeatures: { orderBy: { displayOrder: 'asc' } },
    },
  });

  return toProduct(refreshed ?? row);
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw createError('Producto no encontrado', 404);
  
  // 👇 REEMPLAZAR DELETE POR UPDATE (SOFT DELETE) 👇
  await prisma.product.update({
    where: { id },
    data: {
      status: 'archived', // Marcado como archivado para conservar historial en ventas
      inStock: false,     // Aseguramos que salga del inventario activo
      stock: 0,
    },
  });
}

export async function getLowStockCount(): Promise<number> {
  return prisma.product.count({ where: { stock: { lt: 5 } } });
}

export async function getAdminProducts(query: {
  q?: string;
  categoryId?: string;
  status?: string;
  stockLevel?: string;
  page?: number;
  limit?: number;
}) {
  const { q, categoryId, status, stockLevel, page = 1, limit = 10 } = query;
  const where = buildAdminProductsWhere({ q, categoryId, status, stockLevel });

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: adminProductSelect,
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

export async function getProductsForCatalogExport(query: {
  q?: string;
  categoryId?: string;
  status?: string;
  stockLevel?: string;
  productIds?: string[];
  limit?: number;
}): Promise<Product[]> {
  const { q, categoryId, status, stockLevel, productIds, limit } = query;
  const where = buildAdminProductsWhere({ q, categoryId, status, stockLevel, productIds });
  const rows = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: adminProductSelect,
  });

  return rows.map(toProduct);
}

type ProductQuery = {
  category?: string;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
  isFeatured?: boolean;
  tag?: string;
  isOnSale?: boolean;
  isNovedad?: boolean;
  slugs?: string;
  priceRanges?: string;
};

export async function getPublicProducts(query: ProductQuery) {
  const { category, tag, q, sort, page = 1, limit = 12, isFeatured, slugs } = query;

  const where: Record<string, any> = {
    status: 'active', // 🔒 SEGURIDAD: Solo productos activos son visibles al público
  };

  if (Array.isArray(slugs) && slugs.length > 0) {
    where.slug = { in: slugs };
  }

  if (typeof isFeatured === 'boolean') {
    where.isFeatured = isFeatured;
  }

  // Modificado de consulta JSONB cruda a query relacional eficiente con índice indexado
  if (tag) {
    const taggedProducts = await prisma.productTag.findMany({
      where: {
        tag: {
          name: tag.toLowerCase()
        }
      },
      select: { productId: true }
    });

    const ids = taggedProducts.map(r => r.productId);
    if (ids.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    where.id = where.id
      ? { in: (where.id as any).in.filter((id: string) => ids.includes(id)) }
      : { in: ids };
  }

  if (slugs) {
    const slugArray = slugs.split(',').map(s => s.trim()).filter(Boolean);
    where.slug = { in: slugArray };
  }

  if (category) {
    const foundCategory = await getCategoryBySlug(category);

    const children = await prisma.category.findMany({
      where: { parentId: foundCategory.id },
      select: { id: true },
    });

    const categoryIds = [
      foundCategory.id,
      ...children.map(c => c.id),
    ];

    where.productCategories = {
      some: {
        categoryId: {
          in: categoryIds,
        },
      },
    };
  }

  if (query.priceRanges) {
    const ranges = query.priceRanges
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((range) => {
        const [minStr, maxStr] = range.split('-');
        const min = minStr !== '' ? Number(minStr) : undefined;
        const max = maxStr !== '' ? Number(maxStr) : undefined;
        const filter: Record<string, unknown> = {};

        if (!Number.isNaN(min) && min !== undefined) {
          filter.gte = min;
        }
        if (!Number.isNaN(max) && max !== undefined) {
          filter.lte = max;
        }
        return { price: filter };
      })
      .filter((item) => Object.keys(item.price as Record<string, unknown>).length > 0);

    if (ranges.length > 0) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { OR: ranges },
      ];
    }
  }

  if (q) {
    const search = q.toLowerCase();
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  switch (sort) {
    case 'price_asc': orderBy.price = 'asc'; break;
    case 'price_desc': orderBy.price = 'desc'; break;
    case 'rating': orderBy.rating = 'desc'; break;
    case 'newest': orderBy.createdAt = 'desc'; break;
    default: orderBy.createdAt = 'desc';
  }

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { 
        productImages: { select: { id: true }, orderBy: { position: 'asc' } },
        productCategories: { select: { categoryId: true } },
        productTags: { include: { tag: true } },
        productFeatures: { orderBy: { displayOrder: 'asc' } },
        productOptions: {
          where: { isActive: true },
          include: {
            values: true
          }
        },
        productSkus: {
          where: { isActive: true },
          include: {
            skuValues: {
              include: {
                optionValue: {
                  include: {
                    option: true
                  }
                }
              }
            },
            productSkuImages: {
              select: { id: true }
            }
          }
        }
      },
    }),
  ]);

  const mappedProducts = rows.map((row) => {
    const base = toProduct(row);

    const variants = (row as any).productOptions?.map((opt: any) => ({
      id: opt.id,
      name: opt.name,
      values: opt.values?.map((val: any) => val.name) ?? [],
    })) ?? [];
    (base as any).variants = variants;

    if (Array.isArray((row as any).productSkus)) {
      const skus = (row as any).productSkus.map((s: any) => {
        const attributes: Record<string, string> = {};
        if (Array.isArray(s.skuValues)) {
          for (const sv of s.skuValues) {
            if (sv.optionValue && sv.optionValue.option) {
              attributes[sv.optionValue.option.name] = sv.optionValue.name;
            }
          }
        }

        const images = Array.isArray(s.productSkuImages) && s.productSkuImages.length > 0
          ? s.productSkuImages.map((img: any) => `/api/images/sku/${img.id}`)
          : base.images;

        return {
          id: s.id,
          sku: s.sku,
          attributes,
          images,
          stock: s.stock,
          price: s.price !== null && s.price !== undefined ? Number(s.price) : Number(row.price),
          isActive: s.isActive,
        };
      });
      (base as any).skus = skus;
    }

    return base;
  });

  return {
    data: mappedProducts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const row = await prisma.product.findUnique({
    where: { slug },
    include: {
      productImages: { select: { id: true }, orderBy: { position: 'asc' } },
      productCategories: { select: { categoryId: true } },
      productTags: { include: { tag: true } },
      productFeatures: { orderBy: { displayOrder: 'asc' } },
      productOptions: {
        where: { isActive: true },
        include: {
          values: true
        }
      },
      productSkus: {
        where: { isActive: true },
        include: {
          skuValues: {
            include: {
              optionValue: {
                include: {
                  option: true
                }
              }
            }
          },
          productSkuImages: {
            select: { id: true }
          }
        }
      }
    },
  });
  
  if (!row) throw createError('Producto no encontrado', 404);
  const base = toProduct(row);

  const variants = (row as any).productOptions?.map((opt: any) => ({
    id: opt.id,
    name: opt.name,
    values: opt.values?.map((val: any) => val.name) ?? [],
  })) ?? [];
  (base as any).variants = variants;

  if (Array.isArray((row as any).productSkus)) {
    const skus = (row as any).productSkus.map((s: any) => {
      const attributes: Record<string, string> = {};
      if (Array.isArray(s.skuValues)) {
        for (const sv of s.skuValues) {
          if (sv.optionValue && sv.optionValue.option) {
            attributes[sv.optionValue.option.name] = sv.optionValue.name;
          }
        }
      }

      const images = Array.isArray(s.productSkuImages) && s.productSkuImages.length > 0
        ? s.productSkuImages.map((img: any) => `/api/images/sku/${img.id}`)
        : base.images;

      return {
        id: s.id,
        sku: s.sku,
        attributes,
        images,
        stock: s.stock,
        price: s.price !== null && s.price !== undefined ? Number(s.price) : Number(row.price),
        isActive: s.isActive,
      };
    });
    (base as any).skus = skus;
  }
  return base;
}

export interface ProductPriceHistoryEntry {
  monthKey: string;
  month: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  salesCount: number;
}

const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  if (v !== null && v !== undefined && typeof (v as any).toNumber === 'function') return (v as any).toNumber();
  return parseFloat(String(v));
}

export async function getProductPriceHistory(productId: string): Promise<ProductPriceHistoryEntry[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) throw createError('Producto no encontrado', 404);

  type RawRow = {
    month_key: string;
    year: unknown;
    month: unknown;
    avg_price: unknown;
    min_price: unknown;
    max_price: unknown;
    sales_count: unknown;
  };

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      TO_CHAR(o.created_at, 'YYYY-MM') AS month_key,
      EXTRACT(YEAR FROM o.created_at)::int AS year,
      EXTRACT(MONTH FROM o.created_at)::int AS month,
      AVG(oi.unit_price) AS avg_price,
      MIN(oi.unit_price) AS min_price,
      MAX(oi.unit_price) AS max_price,
      COUNT(*)::int AS sales_count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = ${productId}::uuid
    GROUP BY month_key, year, month
    ORDER BY month_key ASC
  `;

  return rows.map(row => {
    const year = toNum(row.year);
    const month = toNum(row.month);
    return {
      monthKey: row.month_key,
      month: `${MONTH_NAMES_ES[month - 1]} ${year}`,
      avgPrice: Math.round(toNum(row.avg_price)),
      minPrice: Math.round(toNum(row.min_price)),
      maxPrice: Math.round(toNum(row.max_price)),
      salesCount: toNum(row.sales_count),
    };
  });
}