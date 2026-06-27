/**
 * services/imageStorageService.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Gestión completa de imágenes binarias en la base de datos y Cloudflare R2.
 *
 * Funciones:
 *   - Recibe un buffer de cualquier formato (JPEG, PNG, WebP, GIF…)
 *   - Convierte a WebP con compresión configurable
 *   - Genera una miniatura WebP (~240 px de ancho) para previews
 *   - Persiste en R2 (Storage Key) y en la base de datos (BYTEA opcional)
 */

import sharp from 'sharp';
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../config/r2';
import { env } from '../config/env';

// ─── Constantes de configuración ──────────────────────────────────────────────

/** Tamaño máximo del archivo original: 8 MB */
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

/** Ancho máximo de la imagen final almacenada */
const MAX_WIDTH = 1200;

/** Ancho de la miniatura */
const THUMBNAIL_WIDTH = 240;

/** Calidad WebP (0–100); 82 ofrece buena relación calidad/tamaño */
const WEBP_QUALITY = 82;

/** Tipos MIME aceptados */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
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

/** Helper para validar UUID */
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

/**
 * Sincroniza el campo `images` del producto con las imágenes almacenadas en productImageStorage.
 */
async function syncProductImages(productId: string): Promise<void> {
  const allStorageImages = await prisma.productImageStorage.findMany({
    where: { productId },
    orderBy: { position: 'asc' },
    select: {
      id: true,
    },
  });

  const syncedImages = allStorageImages.map((img) => `/api/images/products/${img.id}`);

  await prisma.product.update({
    where: { id: productId },
    data: { images: syncedImages as any },
  });
}

function validateFile(file: UploadedImageFile): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw createError(
      `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: JPEG, PNG, WebP, GIF, BMP, TIFF`,
      400,
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw createError(
      `El archivo supera el tamaño máximo permitido de ${MAX_SIZE_BYTES / 1024 / 1024} MB`,
      400,
    );
  }
}

/**
 * Procesa un buffer de imagen a WebP y genera miniatura.
 */
async function processImage(buffer: Buffer, originalname: string): Promise<ProcessedImage> {
  const base = sharp(buffer).rotate();

  const fullBufferRaw = await base
    .clone()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const fullMeta = await sharp(fullBufferRaw).metadata();

  const thumbBufferRaw = await base
    .clone()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

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

/**
 * Sube y persiste una imagen de producto (R2 + DB).
 */
export async function uploadProductImage(
  productId: string,
  file: UploadedImageFile,
  altText?: string,
  position?: number,
) {
  validateFile(file);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw createError('Producto no encontrado', 404);

  if (position === undefined) {
    const count = await prisma.productImageStorage.count({ where: { productId } });
    position = count;
  }

  const processed = await processImage(file.buffer, file.originalname);
  const timestamp = Date.now();
  const s3KeyFull = `products/${productId}/${timestamp}-${position}.webp`;
  const s3KeyThumb = `products/${productId}/thumbs/${timestamp}-${position}.webp`;

  // Doble escritura a Cloudflare R2
  try {
    await Promise.all([
      r2Client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: s3KeyFull,
        Body: processed.data,
        ContentType: 'image/webp',
      })),
      r2Client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: s3KeyThumb,
        Body: processed.thumbnail,
        ContentType: 'image/webp',
      }))
    ]);
    console.log(`[R2] Imagen de producto guardada con éxito: ${s3KeyFull}`);
  } catch (error) {
    console.error('[R2] Error en doble escritura a Cloudflare R2:', error);
  }

  const created = await prisma.productImageStorage.create({
    data: {
      productId,
      storageKey: s3KeyFull,
      storageThumbKey: s3KeyThumb,
      data: toBytes(processed.data),
      width: processed.width,
      height: processed.height,
      thumbnail: toBytes(processed.thumbnail),
      thumbWidth: processed.thumbWidth,
      thumbHeight: processed.thumbHeight,
      mimeType: 'image/webp',
      originalFilename: processed.originalFilename,
      sizeBytes: processed.sizeBytes,
      altText: altText ?? null,
      position,
    },
  });

  await syncProductImages(productId);

  return toImageMeta(created);
}

/**
 * Obtiene los metadatos de todas las imágenes de un producto (sin binarios).
 */
export async function getProductImages(productId: string) {
  const rows = await prisma.productImageStorage.findMany({
    where: { productId },
    orderBy: { position: 'asc' },
    select: {
      id: true, productId: true, width: true, height: true,
      thumbWidth: true, thumbHeight: true, mimeType: true,
      originalFilename: true, sizeBytes: true, altText: true,
      position: true, createdAt: true, updatedAt: true,
      storageKey: true, storageThumbKey: true
    },
  });
  return rows.map(r => ({ 
    ...r, 
    url: `/api/images/products/${r.id}`, 
    thumbUrl: `/api/images/products/${r.id}/thumb`,
    cdnUrl: r.storageKey ? `${env.R2_PUBLIC_URL}/${r.storageKey}` : null
  }));
}

/**
 * Obtiene los metadatos de una imagen de producto por ID.
 */
export async function getProductImageMeta(id: string) {
  if (!isUUID(id)) {
    throw createError('Imagen no encontrada (Legacy ID)', 404);
  }

  const row = await prisma.productImageStorage.findUnique({
    where: { id },
    select: {
      id: true, productId: true, width: true, height: true,
      thumbWidth: true, thumbHeight: true, mimeType: true,
      originalFilename: true, sizeBytes: true, altText: true,
      position: true, createdAt: true, updatedAt: true,
      storageKey: true, storageThumbKey: true
    },
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  return { 
    ...row, 
    url: `/api/images/products/${row.id}`, 
    thumbUrl: `/api/images/products/${row.id}/thumb`,
    cdnUrl: row.storageKey ? `${env.R2_PUBLIC_URL}/${row.storageKey}` : null
  };
}

/**
 * Actualiza los metadatos de una imagen de producto (altText, position).
 */
export async function updateProductImageMeta(
  id: string,
  data: { altText?: string; position?: number },
) {
  if (!isUUID(id)) {
    throw createError('Imagen no encontrada (Legacy ID)', 404);
  }

  const existing = await prisma.productImageStorage.findUnique({ where: { id } });
  if (!existing) throw createError('Imagen no encontrada', 404);

  const updated = await prisma.productImageStorage.update({
    where: { id },
    data: {
      altText: data.altText !== undefined ? data.altText : existing.altText,
      position: data.position !== undefined ? data.position : existing.position,
    },
    select: {
      id: true, productId: true, width: true, height: true,
      thumbWidth: true, thumbHeight: true, mimeType: true,
      originalFilename: true, sizeBytes: true, altText: true,
      position: true, createdAt: true, updatedAt: true,
    },
  });

  await syncProductImages(existing.productId);

  return { ...updated, url: `/api/images/products/${updated.id}`, thumbUrl: `/api/images/products/${updated.id}/thumb` };
}

/**
 * Elimina una imagen de producto.
 */
export async function deleteProductImage(id: string): Promise<void> {
  if (!isUUID(id)) {
    throw createError('Imagen no encontrada (Legacy ID)', 404);
  }

  const existing = await prisma.productImageStorage.findUnique({ where: { id } });
  if (!existing) throw createError('Imagen no encontrada', 404);
  
  await prisma.productImageStorage.delete({ where: { id } });
  
  await syncProductImages(existing.productId);
}

/**
 * Sirve el binario WebP completo de una imagen de producto.
 */
export async function serveProductImage(id: string): Promise<{ data: Buffer; mimeType: string }> {
  if (!isUUID(id)) {
    throw createError('Imagen no encontrada (Legacy ID)', 404);
  }

  const row = await prisma.productImageStorage.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  return { data: row.data ? Buffer.from(row.data) : Buffer.alloc(0), mimeType: row.mimeType };
}

/**
 * Sirve el binario WebP miniatura de una imagen de producto.
 */
export async function serveProductImageThumb(id: string): Promise<{ data: Buffer; mimeType: string }> {
  if (!isUUID(id)) {
    throw createError('Imagen no encontrada (Legacy ID)', 404);
  }

  const row = await prisma.productImageStorage.findUnique({
    where: { id },
    select: { thumbnail: true, data: true, mimeType: true },
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  const buffer = row.thumbnail ? Buffer.from(row.thumbnail) : (row.data ? Buffer.from(row.data) : Buffer.alloc(0));
  return { data: buffer, mimeType: row.mimeType };
}

// ─── API de categoría ──────────────────────────────────────────────────────────

/**
 * Sube y persiste (upsert) la imagen de una categoría (R2 + DB).
 */
export async function uploadCategoryImage(
  categoryId: string,
  file: UploadedImageFile,
  altText?: string,
) {
  validateFile(file);

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw createError('Categoría no encontrada', 404);

  const processed = await processImage(file.buffer, file.originalname);
  const timestamp = Date.now();
  const s3KeyFull = `categories/${categoryId}/${timestamp}-full.webp`;
  const s3KeyThumb = `categories/${categoryId}/thumbs/${timestamp}-thumb.webp`;

  try {
    await Promise.all([
      r2Client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: s3KeyFull,
        Body: processed.data,
        ContentType: 'image/webp',
      })),
      r2Client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: s3KeyThumb,
        Body: processed.thumbnail,
        ContentType: 'image/webp',
      }))
    ]);
    console.log(`[R2] Imagen de categoría guardada con éxito: ${s3KeyFull}`);
  } catch (error) {
    console.error('[R2] Error en doble escritura a Cloudflare R2:', error);
  }

  const row = await prisma.categoryImageStorage.upsert({
    where: { categoryId },
    create: {
      categoryId,
      storageKey: s3KeyFull,
      storageThumbKey: s3KeyThumb,
      data: toBytes(processed.data),
      width: processed.width,
      height: processed.height,
      thumbnail: toBytes(processed.thumbnail),
      thumbWidth: processed.thumbWidth,
      thumbHeight: processed.thumbHeight,
      mimeType: 'image/webp',
      originalFilename: processed.originalFilename,
      sizeBytes: processed.sizeBytes,
      altText: altText ?? null,
    },
    update: {
      storageKey: s3KeyFull,
      storageThumbKey: s3KeyThumb,
      data: toBytes(processed.data),
      width: processed.width,
      height: processed.height,
      thumbnail: toBytes(processed.thumbnail),
      thumbWidth: processed.thumbWidth,
      thumbHeight: processed.thumbHeight,
      mimeType: 'image/webp',
      originalFilename: processed.originalFilename,
      sizeBytes: processed.sizeBytes,
      altText: altText ?? null,
    },
    select: {
      id: true, categoryId: true, width: true, height: true,
      thumbWidth: true, thumbHeight: true, mimeType: true,
      originalFilename: true, sizeBytes: true, altText: true,
      createdAt: true, updatedAt: true,
    },
  });

  const imageUrl = `/api/images/categories/${row.id}`;
  await prisma.category.update({
    where: { id: categoryId },
    data: { imageUrl },
  });

  return { ...row, url: imageUrl, thumbUrl: `/api/images/categories/${row.id}/thumb` };
}

/**
 * Obtiene los metadatos de la imagen de una categoría.
 */
export async function getCategoryImageMeta(categoryId: string) {
  const row = await prisma.categoryImageStorage.findUnique({
    where: { categoryId },
    select: {
      id: true, categoryId: true, width: true, height: true,
      thumbWidth: true, thumbHeight: true, mimeType: true,
      originalFilename: true, sizeBytes: true, altText: true,
      createdAt: true, updatedAt: true,
      storageKey: true
    },
  });
  if (!row) throw createError('La categoría no tiene imagen subida', 404);
  return { 
    ...row, 
    url: `/api/images/categories/${row.id}`, 
    thumbUrl: `/api/images/categories/${row.id}/thumb`,
    cdnUrl: row.storageKey ? `${env.R2_PUBLIC_URL}/${row.storageKey}` : null
  };
}

/**
 * Sirve el binario WebP completo de una imagen de categoría.
 */
export async function serveCategoryImage(id: string): Promise<{ data: Buffer; mimeType: string }> {
  const row = await prisma.categoryImageStorage.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  return { data: row.data ? Buffer.from(row.data) : Buffer.alloc(0), mimeType: row.mimeType };
}

/**
 * Sirve el binario WebP miniatura de una imagen de categoría.
 */
export async function serveCategoryImageThumb(id: string): Promise<{ data: Buffer; mimeType: string }> {
  const row = await prisma.categoryImageStorage.findUnique({
    where: { id },
    select: { thumbnail: true, data: true, mimeType: true },
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  const buffer = row.thumbnail ? Buffer.from(row.thumbnail) : (row.data ? Buffer.from(row.data) : Buffer.alloc(0));
  return { data: buffer, mimeType: row.mimeType };
}

/**
 * Elimina la imagen de una categoría.
 */
export async function deleteCategoryImage(categoryId: string): Promise<void> {
  const existing = await prisma.categoryImageStorage.findUnique({ where: { categoryId } });
  if (!existing) throw createError('La categoría no tiene imagen', 404);
  await prisma.categoryImageStorage.delete({ where: { categoryId } });

  await prisma.category.update({
    where: { id: categoryId },
    data: { imageUrl: null },
  });
}

// ─── Helper interno ────────────────────────────────────────────────────────────

function toBytes(buf: Buffer): Uint8Array<ArrayBuffer> {
  return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)) as Uint8Array<ArrayBuffer>;
}

function toImageMeta(row: any) {
  return {
    ...row,
    url: `/api/images/products/${row.id}`,
    thumbUrl: `/api/images/products/${row.id}/thumb`,
  };
}