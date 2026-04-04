/**
 * services/bannerImageService.ts
 * Procesamiento y almacenamiento de imágenes de banners en WebP.
 */

import sharp from 'sharp';
import { createError } from '../middlewares/errorHandler';

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_WIDTH = 1600; // Ancho máximo para imágenes de banners
const THUMBNAIL_WIDTH = 600; // Miniatura para preview
const WEBP_QUALITY = 82;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
]);

export interface UploadedImageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface ProcessedBannerImage {
  data: Buffer;
  width: number;
  height: number;
  thumbnail: Buffer;
  thumbWidth: number;
  thumbHeight: number;
  sizeBytes: number;
  originalFilename: string;
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
      `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)} MB. Máximo: 8 MB`,
      400,
    );
  }
}

export async function processBannerImage(file: UploadedImageFile): Promise<ProcessedBannerImage> {
  validateFile(file);

  try {
    // Procesar imagen principal
    const image = sharp(file.buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw createError('No se pudo leer las dimensiones de la imagen', 400);
    }

    // Redimensionar si es muy grande
    const scaledImage = image.resize(MAX_WIDTH, Math.round((MAX_WIDTH / metadata.width) * metadata.height), {
      withoutEnlargement: true,
      fit: 'inside',
    });

    const webpBuffer = await scaledImage.webp({ quality: WEBP_QUALITY }).toBuffer();

    // Obtener dimensiones finales
    const finalMetadata = await sharp(webpBuffer).metadata();
    const finalWidth = finalMetadata.width || metadata.width;
    const finalHeight = finalMetadata.height || metadata.height;

    // Procesar miniatura
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(THUMBNAIL_WIDTH, Math.round((THUMBNAIL_WIDTH / metadata.width) * metadata.height), {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const thumbMetadata = await sharp(thumbnailBuffer).metadata();
    const thumbWidth = thumbMetadata.width || THUMBNAIL_WIDTH;
    const thumbHeight = thumbMetadata.height || Math.round((THUMBNAIL_WIDTH / metadata.width) * metadata.height);

    return {
      data: webpBuffer,
      width: finalWidth,
      height: finalHeight,
      thumbnail: thumbnailBuffer,
      thumbWidth,
      thumbHeight,
      sizeBytes: webpBuffer.length,
      originalFilename: file.originalname,
    };
  } catch (err) {
    if (err instanceof Error && err.message.includes('not a valid')) {
      throw createError('Archivo de imagen inválido o corrupto', 400);
    }
    throw err;
  }
}
