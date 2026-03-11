/**
 * services/imageStorageService.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Gestión completa de imágenes binarias en la base de datos.
 *
 * Funciones:
 *   - Recibe un buffer de cualquier formato (JPEG, PNG, WebP, GIF…)
 *   - Convierte a WebP con compresión configurable
 *   - Genera una miniatura WebP (~200 px de ancho) para previews
 *   - Valida tipo MIME y tamaño máximo antes de procesar
 *   - Persiste en tablas product_images_storage / category_images_storage
 *   - Devuelve metadatos para construir las URLs de servicio
 */

import sharp from 'sharp';
import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

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
  /** WebP completo (puede estar redimensionado a MAX_WIDTH) */
  data: Buffer;
  width: number;
  height: number;
  /** WebP miniatura */
  thumbnail: Buffer;
  thumbWidth: number;
  thumbHeight: number;
  /** Tamaño en bytes del WebP resultante */
  sizeBytes: number;
  originalFilename: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Valida el archivo cargado.
 * @throws 400 si el tipo no es imagen o supera el tamaño máximo.
 */
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
 * Procesa un buffer de imagen:
 *  1. Convierte a WebP con calidad configurable
 *  2. Reduce dimensiones si supera MAX_WIDTH (manteniendo proporción)
 *  3. Genera una miniatura a THUMBNAIL_WIDTH
 */
async function processImage(buffer: Buffer, originalname: string): Promise<ProcessedImage> {
  // Instancia base (strip metadata EXIF para privacidad)
  const base = sharp(buffer).rotate(); // .rotate() aplica rotación EXIF automáticamente

  // ── Imagen completa ──────────────────────────────────────────────────────────
  const fullBufferRaw = await base
    .clone()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: false });

  // Obtener metadatos de la versión final
  const fullMeta = await sharp(fullBufferRaw).metadata();

  // ── Miniatura ────────────────────────────────────────────────────────────────
  const thumbBufferRaw = await base
    .clone()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer({ resolveWithObject: false });

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
 * Sube y persiste una imagen de producto.
 * Convierte a WebP automáticamente y genera miniatura.
 */
export async function uploadProductImage(
  productId: string,
  file: UploadedImageFile,
  altText?: string,
  position?: number,
) {
  validateFile(file);

  // Verificar que el producto existe
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw createError('Producto no encontrado', 404);

  // Calcular posición automática si no se especifica
  if (position === undefined) {
    const count = await prisma.productImageStorage.count({ where: { productId } });
    position = count;
  }

  const processed = await processImage(file.buffer, file.originalname);

  const created = await prisma.productImageStorage.create({
    data: {
      productId,
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
      // NO seleccionamos data ni thumbnail para no cargar binarios en listas
    },
  });
  return rows.map(r => ({ ...r, url: `/api/images/products/${r.id}`, thumbUrl: `/api/images/products/${r.id}/thumb` }));
}

/**
 * Obtiene los metadatos de una imagen de producto por ID.
 */
export async function getProductImageMeta(id: string) {
  const row = await prisma.productImageStorage.findUnique({
    where: { id },
    select: {
      id: true, productId: true, width: true, height: true,
      thumbWidth: true, thumbHeight: true, mimeType: true,
      originalFilename: true, sizeBytes: true, altText: true,
      position: true, createdAt: true, updatedAt: true,
    },
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  return { ...row, url: `/api/images/products/${row.id}`, thumbUrl: `/api/images/products/${row.id}/thumb` };
}

/**
 * Actualiza los metadatos de una imagen de producto (altText, position).
 * Para reemplazar los binarios se debe eliminar y volver a subir.
 */
export async function updateProductImageMeta(
  id: string,
  data: { altText?: string; position?: number },
) {
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
  return { ...updated, url: `/api/images/products/${updated.id}`, thumbUrl: `/api/images/products/${updated.id}/thumb` };
}

/**
 * Elimina una imagen de producto.
 */
export async function deleteProductImage(id: string): Promise<void> {
  const existing = await prisma.productImageStorage.findUnique({ where: { id } });
  if (!existing) throw createError('Imagen no encontrada', 404);
  await prisma.productImageStorage.delete({ where: { id } });
}

/**
 * Sirve el binario WebP completo de una imagen de producto.
 * Retorna el Buffer y el mime type para enviarlo como respuesta HTTP.
 */
export async function serveProductImage(id: string): Promise<{ data: Buffer; mimeType: string }> {
  const row = await prisma.productImageStorage.findUnique({
    where: { id },
    select: { data: true, mimeType: true },
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  return { data: Buffer.from(row.data), mimeType: row.mimeType };
}

/**
 * Sirve el binario WebP miniatura de una imagen de producto.
 */
export async function serveProductImageThumb(id: string): Promise<{ data: Buffer; mimeType: string }> {
  const row = await prisma.productImageStorage.findUnique({
    where: { id },
    select: { thumbnail: true, data: true, mimeType: true },
  });
  if (!row) throw createError('Imagen no encontrada', 404);
  // Si no tiene thumbnail (imágenes antiguas), devuelve el completo
  const buffer = row.thumbnail ? Buffer.from(row.thumbnail) : Buffer.from(row.data);
  return { data: buffer, mimeType: row.mimeType };
}

// ─── API de categoría ──────────────────────────────────────────────────────────

/**
 * Sube y persiste (upsert) la imagen de una categoría.
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

  // upsert: si ya existe imagen para la categoría, la reemplaza
  const row = await prisma.categoryImageStorage.upsert({
    where: { categoryId },
    create: {
      categoryId,
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

  // Actualizar la tabla Category con la URL de la imagen (legacy compat)
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
    },
  });
  if (!row) throw createError('La categoría no tiene imagen subida', 404);
  return { ...row, url: `/api/images/categories/${row.id}`, thumbUrl: `/api/images/categories/${row.id}/thumb` };
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
  return { data: Buffer.from(row.data), mimeType: row.mimeType };
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
  const buffer = row.thumbnail ? Buffer.from(row.thumbnail) : Buffer.from(row.data);
  return { data: buffer, mimeType: row.mimeType };
}

/**
 * Elimina la imagen de una categoría.
 */
export async function deleteCategoryImage(categoryId: string): Promise<void> {
  const existing = await prisma.categoryImageStorage.findUnique({ where: { categoryId } });
  if (!existing) throw createError('La categoría no tiene imagen', 404);
  await prisma.categoryImageStorage.delete({ where: { categoryId } });

  // Limpiar el campo imageUrl en Category (legacy compat)
  await prisma.category.update({
    where: { id: categoryId },
    data: { imageUrl: null },
  });
}

// ─── Helper interno ────────────────────────────────────────────────────────────

/**
 * Convierte un Buffer de Node.js a Uint8Array<ArrayBuffer> que es lo que Prisma
 * espera para campos Bytes (BYTEA en PostgreSQL).
 * A nivel de runtime es la misma memoria; solo resuelve la discrepancia de tipos.
 */
function toBytes(buf: Buffer): Uint8Array<ArrayBuffer> {
  return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)) as Uint8Array<ArrayBuffer>;
}

function toImageMeta(row: {
  id: string; productId: string; width: number; height: number;
  thumbWidth: number | null; thumbHeight: number | null; mimeType: string;
  originalFilename: string | null; sizeBytes: number; altText: string | null;
  position: number; createdAt: Date; updatedAt: Date;
}) {
  return {
    ...row,
    url: `/api/images/products/${row.id}`,
    thumbUrl: `/api/images/products/${row.id}/thumb`,
  };
}
