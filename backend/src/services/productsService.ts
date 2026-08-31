/**
 * services/productsService.ts
 * Lógica de negocio para el dominio de productos usando Prisma Client.
 * OPTIMIZADO: Transacciones atómicas y resolución en memoria para reducir latencia.
 */

import { Prisma, ProductStatus as PrismaProductStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { Product, CreateProductDTO, UpdateProductDTO } from '../models/Product';
import { ProductStatus } from '../types';
import { createError } from '../middlewares/errorHandler';
import { getCategoryBySlug } from './categoriesService';
import { parseSafePrice } from './productSkusService';
import { applyDiscountsToProducts } from './discountService';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../config/r2';
import { env } from '../config/env';
import sharp from 'sharp';

// Constantes de optimización de imágenes
const MAX_WIDTH = 1200;
const THUMBNAIL_WIDTH = 240;
const WEBP_QUALITY = 82;

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

/**
 * Decodifica, procesa y sube una imagen en Base64 a Cloudflare R2.
 */
async function uploadBase64ToR2(productId: string, base64Str: string, position: number) {
  const matches = base64Str.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches) {
    throw createError('Formato de imagen Base64 inválido', 400);
  }

  const buffer = Buffer.from(matches[2], 'base64');
  const base = sharp(buffer).rotate();

  const { data: fullBuffer, info: fullInfo } = await base
    .clone()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  const { data: thumbBuffer, info: thumbInfo } = await base
    .clone()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer({ resolveWithObject: true });

  const timestamp = Date.now();
  const s3KeyFull = `products/${productId}/${timestamp}-${position}.webp`;
  const s3KeyThumb = `products/${productId}/thumbs/${timestamp}-${position}.webp`;

  await Promise.all([
    r2Client.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME, Key: s3KeyFull, Body: fullBuffer, ContentType: 'image/webp'
    })),
    r2Client.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME, Key: s3KeyThumb, Body: thumbBuffer, ContentType: 'image/webp'
    }))
  ]);

  return {
    storageKey: s3KeyFull,
    storageThumbKey: s3KeyThumb,
    width: fullInfo.width ?? 0,
    height: fullInfo.height ?? 0,
    thumbWidth: thumbInfo.width ?? THUMBNAIL_WIDTH,
    thumbHeight: thumbInfo.height ?? 0,
    sizeBytes: fullBuffer.length,
  };
}

function toProduct(row: any): Product {
  const categoryIds = Array.isArray(row.productCategories)
    ? row.productCategories.map((rel: { categoryId: string }) => rel.categoryId)
    : Array.isArray(row.categoryIds)
      ? row.categoryIds
      : [];

  const primaryCategoryId = categoryIds[0] ?? '';

  const tags = Array.isArray(row.productTags)
    ? row.productTags.map((pt: any) => pt.tag?.name ?? pt.name ?? pt)
    : [];

  const features = Array.isArray(row.productFeatures)
    ? row.productFeatures.map((pf: any) => pf.description ?? pf)
    : [];

  const images = Array.isArray(row.productImages)
    ? row.productImages.map((img: any) => {
        if (img.storageKey && (img.storageKey.startsWith('http://') || img.storageKey.startsWith('https://'))) {
          return img.storageKey;
        }
        if (env.R2_PUBLIC_URL && img.storageKey && !img.storageKey.startsWith('/api')) {
          const cleanUrl = `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${img.storageKey.replace(/^\//, '')}`;
          return cleanUrl;
        }
        return `/api/images/products/${img.id}`;
      })
    : [];

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    shortDescription: row.shortDescription ?? undefined,
    price: row.price.toNumber ? row.price.toNumber() : Number(row.price),
    images,
    categoryId: primaryCategoryId,
    categoryIds,
    tags,
    rating: row.rating,
    reviewCount: row.reviewCount,
    inStock: row.inStock,
    stock: row.stock,
    criticalStockThreshold: row.criticalStockThreshold ?? 5,
    sku: row.sku ?? undefined,
    features,
    isFeatured: row.isFeatured ?? false,
    primarySupplierId: row.primarySupplierId ?? null,
    status: row.status as ProductStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as unknown as Product;
}

const adminProductSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  shortDescription: true,
  price: true,
  productImages: { select: { id: true, storageKey: true, storageThumbKey: true }, orderBy: { position: 'asc' } },
  rating: true,
  reviewCount: true,
  inStock: true,
  stock: true,
  criticalStockThreshold: true,
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

function buildAdminProductsWhere(query: Record<string, any>): Record<string, any> {
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
      productImages: { select: { id: true, storageKey: true, storageThumbKey: true }, orderBy: { position: 'asc' } },
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
      productImages: { select: { id: true, storageKey: true, storageThumbKey: true }, orderBy: { position: 'asc' } },
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
            select: { id: true, storageKey: true, storageThumbKey: true }
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

      const variant = Object.values(attributes).join(' / ') || '—';

      return {
        id: s.id,
        sku: s.sku,
        attributes,
        variant,
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
  const fieldErrors: Record<string, string> = {};

  if (!dto.name || !String(dto.name).trim()) {
    fieldErrors.name = 'El nombre es obligatorio';
  }

  if (dto.sku === undefined || dto.sku === null || !String(dto.sku).trim()) {
    fieldErrors.sku = 'El SKU es obligatorio';
  } else if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(String(dto.sku))) {
    fieldErrors.sku = 'Formato inválido del SKU: solo mayúsculas, números y guiones';
  }

  if (dto.price === undefined || dto.price === null) {
    fieldErrors.price = 'El precio es obligatorio';
  } else {
    const parsedPrice = parseSafePrice(dto.price);
    if (parsedPrice === undefined) {
      fieldErrors.price = 'El precio debe ser un número válido';
    } else if (parsedPrice < 0) {
      fieldErrors.price = 'El precio de venta no puede ser negativo';
    }
  }

  if (normalizedCategoryIds.length === 0) {
    fieldErrors.category = 'Seleccioná una categoría';
  }

  if (dto.slug && typeof dto.slug === 'string' && dto.slug.trim().length > 0 && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dto.slug)) {
    fieldErrors.slug = 'El slug debe contener solo letras minúsculas, números y guiones';
  }

  if ((dto as any).criticalStockThreshold !== undefined && Number((dto as any).criticalStockThreshold) < 0) {
    fieldErrors.criticalStockThreshold = 'El umbral de stock crítico no puede ser negativo';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw createError('Datos de producto inválidos', 400, fieldErrors);
  }

  const skuExists = await prisma.product.findUnique({ where: { sku: dto.sku }, select: { id: true } });
  if (skuExists) throw createError('El SKU ya está en uso', 409, { sku: 'Este SKU ya está en uso' });

  await ensureCategoriesExist(normalizedCategoryIds);

  let slug = generateSlug(dto.name);
  let slugExists = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  let counter = 1;
  while (slugExists) {
    slug = `${generateSlug(dto.name)}-${counter}`;
    slugExists = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    counter++;
  }

  const parsedPrice = parseSafePrice(dto.price) ?? 0;
  const threshold = (dto as any).criticalStockThreshold !== undefined && (dto as any).criticalStockThreshold !== null
    ? Math.max(0, parseInt(String((dto as any).criticalStockThreshold), 10) || 5)
    : 5;

  // 🟢 OPTIMIZACIÓN: Transacción atómica para creación
  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        shortDescription: dto.shortDescription ?? null,
        price: parsedPrice,
        status: (dto.status ?? ProductStatus.ACTIVE) as unknown as PrismaProductStatus,
        sku: dto.sku,
        stock: dto.stock ?? 0,
        criticalStockThreshold: threshold,
        rating: dto.rating ?? 0,
        reviewCount: dto.reviewCount ?? 0,
        inStock: true,
        isFeatured: dto.isFeatured ?? false,
        ...(dto.primarySupplierId !== undefined ? { primarySupplierId: dto.primarySupplierId ?? null } : {}),
        productCategories: {
          create: normalizedCategoryIds.map(id => ({ categoryId: id }))
        }
      },
    });

    if (Array.isArray(dto.tags) && dto.tags.length > 0) {
      const uniqueTags = Array.from(new Set(dto.tags.map(t => t.trim().toLowerCase()).filter(Boolean)));
      const existingTags = await tx.tag.findMany({ where: { name: { in: uniqueTags } } });
      const existingTagNames = new Set(existingTags.map(t => t.name));
      const missingTagNames = uniqueTags.filter(name => !existingTagNames.has(name));

      if (missingTagNames.length > 0) {
        await tx.tag.createMany({ data: missingTagNames.map(name => ({ name })), skipDuplicates: true });
      }

      const allTags = await tx.tag.findMany({ where: { name: { in: uniqueTags } } });
      await tx.productTag.createMany({
        data: allTags.map(t => ({ productId: newProduct.id, tagId: t.id })),
        skipDuplicates: true,
      });
    }

    if (Array.isArray(dto.features) && dto.features.length > 0) {
      const cleanFeatures = dto.features.map(f => f.trim()).filter(Boolean);
      await tx.productFeature.createMany({
        data: cleanFeatures.map((desc, idx) => ({
          productId: newProduct.id,
          description: desc,
          displayOrder: idx,
        })),
      });
    }

    return newProduct;
  });

  if (Array.isArray(dto.images) && dto.images.length > 0) {
    const imageRecordsRaw = await Promise.all(
      dto.images.map(async (url, index) => {
        if (url.startsWith('data:image/')) {
          const uploaded = await uploadBase64ToR2(product.id, url, index);
          return {
            productId: product.id,
            ...uploaded,
            mimeType: 'image/webp',
            originalFilename: 'wizard_upload',
            position: index,
          };
        }
        return null;
      })
    );

    const imageRecords = imageRecordsRaw.filter(Boolean) as any[];
    if (imageRecords.length > 0) {
      await prisma.productImageStorage.createMany({
        data: imageRecords,
      });
    }
  }

  const refreshed = await prisma.product.findUnique({
    where: { id: product.id },
    select: adminProductSelect,
  });

  return toProduct(refreshed ?? product);
}

export async function updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      sku: true,
      name: true,
      slug: true,
      price: true,
      stock: true,
      status: true,
      rating: true,
      reviewCount: true,
      inStock: true,
      isFeatured: true,
      criticalStockThreshold: true,
      productCategories: { select: { categoryId: true } },
      productSkus: { where: { isActive: true }, select: { price: true } },
      productTags: { select: { tag: { select: { name: true } } } },
    },
  });
  if (!existing) throw createError('Producto no encontrado', 404);

  const fieldErrors: Record<string, string> = {};

  if (dto.name !== undefined && !String(dto.name).trim()) {
    fieldErrors.name = 'El nombre es obligatorio';
  }

  if (dto.sku !== undefined) {
    if (!String(dto.sku).trim()) {
      fieldErrors.sku = 'El SKU es obligatorio';
    } else if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(String(dto.sku))) {
      fieldErrors.sku = 'Formato inválido del SKU: solo mayúsculas, números y guiones';
    }
  }

  if (dto.price !== undefined) {
    const parsedPrice = parseSafePrice(dto.price);
    if (parsedPrice === undefined) {
      fieldErrors.price = 'El precio debe ser un número válido';
    } else if (parsedPrice < 0) {
      fieldErrors.price = 'El precio de venta no puede ser negativo';
    }
  }

  if (dto.categoryId !== undefined || dto.categoryIds !== undefined) {
    const normalizedUpdateCategoryIds = normalizeCategoryIds(dto.categoryId, dto.categoryIds);
    if (normalizedUpdateCategoryIds.length === 0) {
      fieldErrors.category = 'Seleccioná una categoría';
    }
  }

  if (dto.slug !== undefined && typeof dto.slug === 'string' && dto.slug.trim().length > 0 && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(dto.slug)) {
    fieldErrors.slug = 'El slug debe contener solo letras minúsculas, números y guiones';
  }

  if ((dto as any).criticalStockThreshold !== undefined && Number((dto as any).criticalStockThreshold) < 0) {
    fieldErrors.criticalStockThreshold = 'El umbral de stock crítico no puede ser negativo';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw createError('Datos de producto inválidos', 400, fieldErrors);
  }

  if (dto.sku && dto.sku !== existing.sku) {
    const skuExists = await prisma.product.findFirst({
      where: { sku: dto.sku, id: { not: id } },
      select: { id: true },
    });
    if (skuExists) throw createError(`El SKU "${dto.sku}" ya está en uso por otro producto`, 409, { sku: 'Este SKU ya está en uso por otro producto' });
  }

  let slug = existing.slug;
  if (dto.name && dto.name !== existing.name) {
    slug = generateSlug(dto.name);
    let slugExists = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    let counter = 1;
    while (slugExists && slugExists.id !== id) {
      slug = `${generateSlug(dto.name)}-${counter}`;
      slugExists = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
      counter++;
    }
  }

  const existingCategoryIds = existing.productCategories.length > 0
    ? existing.productCategories.map((rel) => rel.categoryId)
    : [];

  const shouldUpdateCategories = dto.categoryId !== undefined || dto.categoryIds !== undefined;
  const normalizedCategoryIds = shouldUpdateCategories
    ? normalizeCategoryIds(dto.categoryId ?? undefined, dto.categoryIds)
    : existingCategoryIds;

  const shouldSyncProductAvailability = dto.stock !== undefined || dto.inStock !== undefined;
  const nextProductInStock = dto.inStock !== undefined
    ? dto.inStock
    : dto.stock !== undefined
      ? dto.stock > 0
      : undefined;

  let finalPrice = dto.price !== undefined ? parseSafePrice(dto.price) : undefined;

  if (finalPrice !== undefined && finalPrice !== null && finalPrice < 0) {
    throw createError('El precio de venta no puede ser negativo', 400);
  }

  if (finalPrice !== undefined && existing.productSkus.length > 0) {
    const skuPrices = existing.productSkus
      .map((s) => s.price ? Number(s.price) : null)
      .filter((p): p is number => p !== null && p > 0);

    if (skuPrices.includes(Number(finalPrice)) && Number(finalPrice) !== Number(existing.price)) {
      finalPrice = Number(existing.price);
    }
  }

  const threshold = (dto as any).criticalStockThreshold !== undefined && (dto as any).criticalStockThreshold !== null
    ? Math.max(0, parseInt(String((dto as any).criticalStockThreshold), 10) || 0)
    : undefined;

  // 🟢 OPTIMIZACIÓN: Transacción atómica para actualización (Elimina el N+1)
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        slug,
        description: dto.description !== undefined ? dto.description : undefined,
        shortDescription: dto.shortDescription !== undefined ? dto.shortDescription : undefined,
        price: finalPrice !== undefined ? finalPrice : undefined,
        status: dto.status ? (dto.status as unknown as PrismaProductStatus) : undefined,
        sku: dto.sku !== undefined ? dto.sku : undefined,
        stock: dto.stock !== undefined ? dto.stock : undefined,
        criticalStockThreshold: threshold !== undefined ? threshold : undefined,
        rating: dto.rating !== undefined ? dto.rating : undefined,
        reviewCount: dto.reviewCount !== undefined ? dto.reviewCount : undefined,
        inStock: shouldSyncProductAvailability
          ? (dto.stock !== undefined ? dto.stock > 0 : nextProductInStock ?? existing.inStock)
          : undefined,
        novedadSince: (() => {
          const incomingTags = Array.isArray(dto.tags) ? dto.tags : null;
          if (incomingTags === null) return undefined;
          const teniaNovedad = existing.productTags.some(pt => pt.tag.name === 'novedad');
          const tieneNovedad = incomingTags.includes('novedad');
          if (tieneNovedad && !teniaNovedad) return new Date();
          if (!tieneNovedad) return null;
          return undefined;
        })(),
        isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : undefined,
        ...(dto.primarySupplierId !== undefined ? { primarySupplierId: dto.primarySupplierId ?? null } : {}),
      },
    });

    if (shouldUpdateCategories) {
      await tx.productCategory.deleteMany({ where: { productId: id } });
      if (normalizedCategoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: normalizedCategoryIds.map(categoryId => ({ productId: id, categoryId })),
          skipDuplicates: true,
        });
      }
    }

    if (dto.tags !== undefined) {
      const uniqueTags = Array.from(new Set(Array.isArray(dto.tags) ? dto.tags.map(t => t.trim().toLowerCase()).filter(Boolean) : []));
      await tx.productTag.deleteMany({ where: { productId: id } });
      
      if (uniqueTags.length > 0) {
        const existingTags = await tx.tag.findMany({ where: { name: { in: uniqueTags } } });
        const existingTagNames = new Set(existingTags.map(t => t.name));
        const missingTagNames = uniqueTags.filter(name => !existingTagNames.has(name));

        if (missingTagNames.length > 0) {
          await tx.tag.createMany({ data: missingTagNames.map(name => ({ name })), skipDuplicates: true });
        }

        const allTags = await tx.tag.findMany({ where: { name: { in: uniqueTags } } });
        await tx.productTag.createMany({
          data: allTags.map(t => ({ productId: id, tagId: t.id })),
          skipDuplicates: true,
        });
      }
    }

    if (dto.features !== undefined) {
      const cleanFeatures = Array.isArray(dto.features) ? dto.features.map(f => f.trim()).filter(Boolean) : [];
      await tx.productFeature.deleteMany({ where: { productId: id } });
      if (cleanFeatures.length > 0) {
        await tx.productFeature.createMany({
          data: cleanFeatures.map((desc, idx) => ({ productId: id, description: desc, displayOrder: idx })),
        });
      }
    }
  });

  // 🟢 PROTECCIÓN ESTRICTA DE IMÁGENES R2: Si solo vienen URLs ya subidas, NO borramos ni alteramos las storageKeys
  if (dto.images !== undefined && Array.isArray(dto.images)) {
    const base64Images = dto.images.filter(url => typeof url === 'string' && url.startsWith('data:image/'));
    if (base64Images.length > 0) {
      for (let i = 0; i < base64Images.length; i++) {
        const uploaded = await uploadBase64ToR2(id, base64Images[i], i);
        await prisma.productImageStorage.create({
          data: {
            productId: id,
            ...uploaded,
            mimeType: 'image/webp',
            originalFilename: 'wizard_upload',
            position: i,
          },
        });
      }
    }
  }

  const refreshed = await prisma.product.findUnique({
    where: { id },
    select: adminProductSelect,
  });

  return toProduct(refreshed);
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true, sku: true } });
  if (!existing) throw createError('Producto no encontrado', 404);

  const timestamp = Date.now();
  const archivedSlug = `${existing.slug}-archived-${timestamp}`;
  const archivedSku = existing.sku ? `${existing.sku}-archived-${timestamp}` : null;

  await prisma.product.update({
    where: { id },
    data: {
      status: 'archived',
      slug: archivedSlug,
      sku: archivedSku,
      inStock: false,
      stock: 0,
    },
  });
}

export async function getLowStockCount(): Promise<number> {
  type CountResult = { count: bigint }[];
  const result = await prisma.$queryRaw<CountResult>`
    SELECT COUNT(*)::bigint as count 
    FROM products 
    WHERE stock < critical_stock_threshold 
      AND status::text != 'archived'
  `;
  return result[0] ? Number(result[0].count) : 0;
}

export async function getAdminProducts(query: Record<string, any>) {
  const { q, categoryId, status, stockLevel, page = 1, limit = 10 } = query;
  const where = buildAdminProductsWhere({ q, categoryId, status, stockLevel });

  const total = await prisma.product.count({ where });

  const idsRow = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    select: { id: true },
  });

  const ids = idsRow.map(r => r.id);

  const rows = ids.length > 0
    ? await prisma.product.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: 'desc' },
      select: adminProductSelect,
    })
    : [];

  return {
    data: rows.map(toProduct),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductsForCatalogExport(query: Record<string, any>): Promise<Product[]> {
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
  const { category, tag, q, sort, page = 1, limit = 12, isFeatured, slugs, isOnSale, isNovedad } = query;

  const where: Record<string, any> = {
    status: 'active',
  };

  if (Array.isArray(slugs) && slugs.length > 0) {
    where.slug = { in: slugs };
  }

  let effectiveTag = tag;
  let effectiveIsFeatured = isFeatured;

  if (tag?.toLowerCase() === 'destacado') {
    effectiveIsFeatured = true;
    effectiveTag = undefined;
  }

  if (typeof effectiveIsFeatured === 'boolean') {
    where.isFeatured = effectiveIsFeatured;
  }

  if (isOnSale === true || tag?.toLowerCase() === 'oferta') {
    const saleProducts = await prisma.productTag.findMany({
      where: {
        tag: {
          name: 'oferta'
        }
      },
      select: { productId: true }
    });

    const ids = saleProducts.map(r => r.productId);
    if (ids.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    where.id = where.id
      ? { in: (where.id as any).in.filter((id: string) => ids.includes(id)) }
      : { in: ids };

    effectiveTag = undefined;
  }
  else if (isNovedad === true || tag?.toLowerCase() === 'novedad') {
    const novedadProducts = await prisma.productTag.findMany({
      where: {
        tag: {
          name: 'novedad'
        }
      },
      select: { productId: true }
    });

    const ids = novedadProducts.map(r => r.productId);
    if (ids.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    where.id = where.id
      ? { in: (where.id as any).in.filter((id: string) => ids.includes(id)) }
      : { in: ids };

    effectiveTag = undefined;
  }

  if (effectiveTag) {
    const taggedProducts = await prisma.productTag.findMany({
      where: {
        tag: {
          name: effectiveTag.toLowerCase()
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
    const slugArray = slugs.split(',').map((s: string) => s.trim()).filter(Boolean);
    where.slug = { in: slugArray };
  }

  if (category) {
    const foundCategory = await getCategoryBySlug(category);

    if (!foundCategory.isVisible) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const children = await prisma.category.findMany({
      where: { parentId: foundCategory.id, isVisible: true },
      select: { id: true },
    }) || [];

    const categoryIds = [
      foundCategory.id,
      ...children.map(c => c.id),
    ];

    where.AND = [
      ...(where.AND || []),
      {
        productCategories: {
          some: {
            categoryId: {
              in: categoryIds,
            },
          },
        },
      },
    ];
  }

  where.AND = [
    ...(where.AND || []),
    {
      productCategories: {
        some: {
          category: {
            isVisible: true,
          },
        },
      },
    },
  ];

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
      .filter((item: any) => Object.keys(item.price as Record<string, unknown>).length > 0);

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

  const total = await prisma.product.count({ where });

  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  switch (sort) {
    case 'price_asc': orderBy.price = 'asc'; break;
    case 'price_desc': orderBy.price = 'desc'; break;
    case 'rating': orderBy.rating = 'desc'; break;
    case 'newest': orderBy.createdAt = 'desc'; break;
    default: orderBy.createdAt = 'desc';
  }

  const idsRow = await prisma.product.findMany({
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
    select: { id: true },
  });

  const ids = idsRow.map(r => r.id);

  const rows = ids.length > 0
    ? await prisma.product.findMany({
      where: { id: { in: ids } },
      orderBy,
      include: {
        productImages: { select: { id: true, storageKey: true, storageThumbKey: true }, orderBy: { position: 'asc' }, take: 2 },
        productCategories: { select: { categoryId: true } },
        productTags: { include: { tag: true } },
        productSkus: {
          where: { isActive: true },
          select: {
            price: true,
            stock: true,
            isActive: true
          }
        }
      },
    })
    : [];

  const mappedProducts = rows.map((row) => {
    const base = toProduct(row);
    (base as any).variants = [];
    (base as any).skus = [];

    if (Array.isArray((row as any).productSkus) && (row as any).productSkus.length > 0) {
      const skus = (row as any).productSkus;
      const activeSkus = skus.filter((s: any) => s.isActive);
      if (activeSkus.length > 0) {
        base.price = Math.min(...activeSkus.map((s: any) => s.price !== null && s.price !== undefined ? Number(s.price) : Number(row.price)));
        base.stock = activeSkus.reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
        base.inStock = true;
      }
    }

    return base;
  });

  const productsWithDiscounts = await applyDiscountsToProducts(mappedProducts);

  return {
    data: productsWithDiscounts,
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
      productImages: { select: { id: true, storageKey: true, storageThumbKey: true }, orderBy: { position: 'asc' } },
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
            select: { id: true, storageKey: true, storageThumbKey: true }
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

      const variant = Object.values(attributes).join(' / ') || '—';

      return {
        id: s.id,
        sku: s.sku,
        attributes,
        variant,
        images,
        stock: s.stock,
        price: s.price !== null && s.price !== undefined ? Number(s.price) : Number(row.price),
        isActive: s.isActive,
      };
    });
    (base as any).skus = skus;

    if (skus.length > 0) {
      const activeSkus = skus.filter((s: any) => s.isActive);
      if (activeSkus.length > 0) {
        base.price = Math.min(...activeSkus.map((s: any) => s.price));
        base.stock = activeSkus.reduce((sum: number, s: any) => sum + (s.stock || 0), 0);
        base.inStock = true;
      }
    }
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