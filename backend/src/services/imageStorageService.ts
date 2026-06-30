/**
 * services/imageStorageService.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Gestión completa de imágenes vía Cloudflare R2.
 * Los binarios ya no se guardan en la base de datos local para optimizar espacio.
 */

import sharp from 'sharp';
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../config/r2';
import { env } from '../config/env';

// ─── Constantes de configuración ──────────────────────────────────────────────

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_WIDTH = 1200;
const THUMBNAIL_WIDTH = 240;
const WEBP_QUALITY = 82;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff',
]);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface UploadedImageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  thumbnail: Buffer;
  thumbWidth: number;
  thumbHeight: number;
  sizeBytes: number;
  originalFilename: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);


function validateFile(file: UploadedImageFile): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw createError(`Tipo de archivo no permitido: ${file.mimetype}`, 400);
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw createError(`El archivo supera el tamaño máximo permitido de 8 MB`, 400);
  }
}

async function processImage(buffer: Buffer, originalname: string): Promise<ProcessedImage> {
  const base = sharp(buffer).rotate();
  const fullBufferRaw = await base.clone().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toBuffer();
  const fullMeta = await sharp(fullBufferRaw).metadata();
  const thumbBufferRaw = await base.clone().resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
  const thumbMeta = await sharp(thumbBufferRaw).metadata();

  return {
    data: fullBufferRaw,
    width: fullMeta.width ?? 0,
    height: fullMeta.height ?? 0,
    thumbnail: thumbBufferRaw,
    thumbWidth: thumbMeta.width ?? 0,
    thumbHeight: thumbMeta.height ?? 0,
    sizeBytes: fullBufferRaw.length,
    originalFilename: originalname,
  };
}

// ─── API de producto ───────────────────────────────────────────────────────────

export async function uploadProductImage(productId: string, file: UploadedImageFile, altText?: string, position?: number) {
  validateFile(file);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw createError('Producto no encontrado', 404);

  if (position === undefined) {
    position = await prisma.productImageStorage.count({ where: { productId } });
  }

  const processed = await processImage(file.buffer, file.originalname);
  const timestamp = Date.now();
  const s3KeyFull = `products/${productId}/${timestamp}-${position}.webp`;
  const s3KeyThumb = `products/${productId}/thumbs/${timestamp}-${position}.webp`;

  try {
    await Promise.all([
      r2Client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME, Key: s3KeyFull, Body: processed.data, ContentType: 'image/webp'
      })),
      r2Client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME, Key: s3KeyThumb, Body: processed.thumbnail, ContentType: 'image/webp'
      }))
    ]);
    console.log(`[R2] Imagen enviada a Cloudflare: ${s3KeyFull}`);
  } catch (error) {
    console.error('[R2] Error crítico en subida a R2:', error);
    throw createError('No se pudo subir la imagen a la nube', 500);
  }

  const created = await prisma.productImageStorage.create({
    data: {
      productId,
      storageKey: s3KeyFull,
      storageThumbKey: s3KeyThumb,
      width: processed.width,
      height: processed.height,
      thumbWidth: processed.thumbWidth,
      thumbHeight: processed.thumbHeight,
      mimeType: 'image/webp',
      originalFilename: processed.originalFilename,
      sizeBytes: processed.sizeBytes,
      altText: altText ?? null,
      position,
    },
  });

  return toImageMeta(created);
}

export async function getProductImages(productId: string) {
  const rows = await prisma.productImageStorage.findMany({
    where: { productId },
    orderBy: { position: 'asc' },
  });
  return rows.map(r => ({ 
    ...r, 
    url: `/api/images/products/${r.id}`, 
    thumbUrl: `/api/images/products/${r.id}/thumb`,
    cdnUrl: r.storageKey ? `${env.R2_PUBLIC_URL}/${r.storageKey}` : null
  }));
}

export async function getProductImageMeta(id: string) {
  if (!isUUID(id)) throw createError('Imagen no encontrada (Legacy ID)', 404);
  const row = await prisma.productImageStorage.findUnique({ where: { id } });
  if (!row) throw createError('Imagen no encontrada', 404);
  return { ...row, url: `/api/images/products/${row.id}`, thumbUrl: `/api/images/products/${row.id}/thumb` };
}

export async function deleteProductImage(id: string): Promise<void> {
  if (!isUUID(id)) throw createError('Imagen no encontrada (Legacy ID)', 404);
  const existing = await prisma.productImageStorage.findUnique({ where: { id } });
  if (!existing) throw createError('Imagen no encontrada', 404);
  await prisma.productImageStorage.delete({ where: { id } });
}

export async function serveProductImage(id: string): Promise<{ data: Buffer; mimeType: string; redirectUrl?: string }> {
  if (!isUUID(id)) throw createError('Imagen no encontrada (Legacy ID)', 404);
  const row = await prisma.productImageStorage.findUnique({
    where: { id },
    select: { mimeType: true, storageKey: true }
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  if (row.storageKey && env.R2_PUBLIC_URL) {
    return { data: Buffer.alloc(0), mimeType: row.mimeType, redirectUrl: `${env.R2_PUBLIC_URL}/${row.storageKey}` };
  }
  throw createError('Imagen no disponible', 404);
}

export async function serveProductImageThumb(id: string): Promise<{ data: Buffer; mimeType: string; redirectUrl?: string }> {
  if (!isUUID(id)) throw createError('Imagen no encontrada (Legacy ID)', 404);
  const row = await prisma.productImageStorage.findUnique({
    where: { id },
    select: { mimeType: true, storageThumbKey: true }
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  if (row.storageThumbKey && env.R2_PUBLIC_URL) {
    return { data: Buffer.alloc(0), mimeType: row.mimeType, redirectUrl: `${env.R2_PUBLIC_URL}/${row.storageThumbKey}` };
  }
  throw createError('Miniatura no disponible', 404);
}

export async function uploadCategoryImage(categoryId: string, file: UploadedImageFile, altText?: string) {
  validateFile(file);
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw createError('Categoría no encontrada', 404);

  const processed = await processImage(file.buffer, file.originalname);
  const timestamp = Date.now();
  const s3KeyFull = `categories/${categoryId}/${timestamp}-full.webp`;
  const s3KeyThumb = `categories/${categoryId}/thumbs/${timestamp}-thumb.webp`;

  try {
    await Promise.all([
      r2Client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: s3KeyFull, Body: processed.data, ContentType: 'image/webp' })),
      r2Client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: s3KeyThumb, Body: processed.thumbnail, ContentType: 'image/webp' }))
    ]);
  } catch (error) {
    console.error('[R2] Error categoría:', error);
  }

  const row = await prisma.categoryImageStorage.upsert({
    where: { categoryId },
    create: {
      categoryId, storageKey: s3KeyFull, storageThumbKey: s3KeyThumb,
      width: processed.width, height: processed.height,
      thumbWidth: processed.thumbWidth, thumbHeight: processed.thumbHeight,
      mimeType: 'image/webp', originalFilename: processed.originalFilename,
      sizeBytes: processed.sizeBytes, altText: altText ?? null,
    },
    update: {
      storageKey: s3KeyFull, storageThumbKey: s3KeyThumb,
      width: processed.width, height: processed.height,
      thumbWidth: processed.thumbWidth, thumbHeight: processed.thumbHeight,
      mimeType: 'image/webp', originalFilename: processed.originalFilename,
      sizeBytes: processed.sizeBytes, altText: altText ?? null,
    },
  });

  const imageUrl = `/api/images/categories/${row.id}`;
  await prisma.category.update({ where: { id: categoryId }, data: { imageUrl } });
  return { ...row, url: imageUrl, thumbUrl: `/api/images/categories/${row.id}/thumb` };
}

export async function serveCategoryImage(id: string): Promise<{ data: Buffer; mimeType: string; redirectUrl?: string }> {
  const row = await prisma.categoryImageStorage.findUnique({ where: { id }, select: { mimeType: true, storageKey: true } });
  if (row?.storageKey && env.R2_PUBLIC_URL) {
    return { data: Buffer.alloc(0), mimeType: row.mimeType, redirectUrl: `${env.R2_PUBLIC_URL}/${row.storageKey}` };
  }
  throw createError('Imagen no encontrada', 404);
}

export async function serveCategoryImageThumb(id: string): Promise<{ data: Buffer; mimeType: string; redirectUrl?: string }> {
  const row = await prisma.categoryImageStorage.findUnique({ where: { id }, select: { mimeType: true, storageThumbKey: true } });
  if (row?.storageThumbKey && env.R2_PUBLIC_URL) {
    return { data: Buffer.alloc(0), mimeType: row.mimeType, redirectUrl: `${env.R2_PUBLIC_URL}/${row.storageThumbKey}` };
  }
  throw createError('Miniatura no encontrada', 404);
}

export async function getCategoryImageMeta(categoryId: string) {
  const row = await prisma.categoryImageStorage.findUnique({ where: { categoryId } });
  if (!row) throw createError('La categoría no tiene imagen', 404);
  return { ...row, url: `/api/images/categories/${row.id}`, thumbUrl: `/api/images/categories/${row.id}/thumb` };
}

export async function deleteCategoryImage(categoryId: string): Promise<void> {
  const existing = await prisma.categoryImageStorage.findUnique({ where: { categoryId } });
  if (!existing) throw createError('La categoría no tiene imagen', 404);
  await prisma.categoryImageStorage.delete({ where: { categoryId } });
  await prisma.category.update({ where: { id: categoryId }, data: { imageUrl: null } });
}

function toImageMeta(row: any) {
  return { ...row, url: `/api/images/products/${row.id}`, thumbUrl: `/api/images/products/${row.id}/thumb` };
}