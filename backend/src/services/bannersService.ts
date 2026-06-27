/**
 * services/bannersService.ts
 * Lógica de negocio para el dominio de banners usando Prisma Client y Cloudflare R2.
 */

import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { BannerWithImageMeta } from '../models/Banner';
import { createError } from '../middlewares/errorHandler';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../config/r2';
import { env } from '../config/env';

function toBuffer(bytes: Uint8Array | Buffer | null): Buffer {
  if (!bytes) return Buffer.alloc(0);
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
}

/** Mapea el resultado de Prisma al tipo BannerWithImageMeta */
function toBannerWithMeta(row: any): BannerWithImageMeta {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    isPinned: row.isPinned,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    width: row.width,
    height: row.height,
    thumbWidth: row.thumbWidth ?? undefined,
    thumbHeight: row.thumbHeight ?? undefined,
    sizeBytes: row.sizeBytes,
    originalFilename: row.originalFilename ?? undefined,
    altText: row.altText ?? undefined,
    filterConfig: row.filterConfig ?? undefined,
  };
}

/** Para respuestas públicas sin datos binarios */
function toBannerPublic(row: any): any {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    isPinned: row.isPinned,
    isActive: row.isActive,
    imageUrl: `/api/images/banners/${row.id}`,
    thumbUrl: `/api/images/banners/${row.id}/thumb`,
    altText: row.altText ?? undefined,
    filterConfig: row.filterConfig ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    cdnUrl: row.storageKey ? `${env.R2_PUBLIC_URL}/${row.storageKey}` : null
  };
}

export async function getAllBanners(): Promise<BannerWithImageMeta[]> {
  const rows = await prisma.banner.findMany({
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ],
  });
  return rows.map(toBannerWithMeta);
}

export async function getActiveBannersPublic(): Promise<any[]> {
  const rows = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ],
  });
  return rows.map(toBannerPublic);
}

export async function getBannerById(id: string): Promise<BannerWithImageMeta> {
  const row = await prisma.banner.findUnique({
    where: { id },
  });
  if (!row) throw createError('Banner no encontrado', 404);
  return toBannerWithMeta(row);
}

export async function getBannerImageData(id: string): Promise<{ data: Buffer; width: number; height: number }> {
  const row = await prisma.banner.findUnique({
    where: { id },
    select: { data: true, width: true, height: true },
  });
  if (!row) throw createError('Banner no encontrado', 404);
  return { data: toBuffer(row.data), width: row.width, height: row.height };
}

export async function getBannerThumbnail(id: string): Promise<{ data: Buffer; width: number; height: number }> {
  const row = await prisma.banner.findUnique({
    where: { id },
    select: { thumbnail: true, thumbWidth: true, thumbHeight: true },
  });
  if (!row) throw createError('Banner no encontrado', 404);
  if (!row.thumbnail) throw createError('Miniatura no disponible', 404);
  return {
    data: toBuffer(row.thumbnail),
    width: row.thumbWidth ?? 0,
    height: row.thumbHeight ?? 0
  };
}

export async function createBanner(
  title: string,
  description: string | undefined,
  altText: string | undefined,
  isPinned: boolean,
  isActive: boolean,
  imageData: any,
  filterConfig: Record<string, unknown>,
): Promise<BannerWithImageMeta> {
  if (!title.trim()) {
    throw createError('El título es requerido', 400);
  }

  // Creamos el registro inicial para obtener el ID real
  const tempRow = await prisma.banner.create({
    data: {
      title,
      description: description ?? null,
      altText: altText ?? null,
      isPinned,
      isActive,
      data: new Uint8Array(imageData.data),
      width: imageData.width,
      height: imageData.height,
      thumbnail: imageData.thumbnail ? new Uint8Array(imageData.thumbnail) : null,
      thumbWidth: imageData.thumbWidth ?? null,
      thumbHeight: imageData.thumbHeight ?? null,
      sizeBytes: imageData.sizeBytes,
      originalFilename: imageData.originalFilename ?? null,
      mimeType: 'image/webp',
      filterConfig: (filterConfig ?? {}) as Prisma.InputJsonValue,
    },
  });

  const s3KeyFull = `banners/${tempRow.id}/full.webp`;
  const s3KeyThumb = `banners/${tempRow.id}/thumb.webp`;

  // Doble escritura a R2
  try {
    const uploads = [
      r2Client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: s3KeyFull,
        Body: imageData.data,
        ContentType: 'image/webp',
      }))
    ];

    if (imageData.thumbnail) {
      uploads.push(
        r2Client.send(new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: s3KeyThumb,
          Body: imageData.thumbnail,
          ContentType: 'image/webp',
        }))
      );
    }

    await Promise.all(uploads);
    console.log(`[R2] Banner backup guardado en R2: ${s3KeyFull}`);

    // Actualizamos con las storageKeys
    const finalRow = await prisma.banner.update({
      where: { id: tempRow.id },
      data: {
        storageKey: s3KeyFull,
        storageThumbKey: s3KeyThumb
      }
    });

    return toBannerWithMeta(finalRow);
  } catch (error) {
    console.error('[R2] Error en doble escritura de Banner:', error);
    return toBannerWithMeta(tempRow);
  }
}

export async function updateBanner(
  id: string,
  updates: Partial<{
    title: string;
    description: string | null;
    isPinned: boolean;
    isActive: boolean;
    altText: string | null;
    filterConfig: Record<string, unknown>;
  }>,
): Promise<BannerWithImageMeta> {
  const existing = await prisma.banner.findUnique({
    where: { id },
  });
  if (!existing) throw createError('Banner no encontrado', 404);

  const row = await prisma.banner.update({
    where: { id },
    data: {
      title: updates.title ?? existing.title,
      description: updates.description !== undefined ? updates.description : existing.description,
      isPinned: updates.isPinned ?? false,
      isActive: updates.isActive ?? existing.isActive,
      altText: updates.altText !== undefined ? updates.altText : existing.altText,
      filterConfig: (updates.filterConfig !== undefined
        ? updates.filterConfig
        : existing.filterConfig) as Prisma.InputJsonValue,
    },
  });

  return toBannerWithMeta(row);
}

export async function updateBannerImage(
  id: string,
  imageData: any,
): Promise<BannerWithImageMeta> {
  const existing = await prisma.banner.findUnique({
    where: { id },
  });
  if (!existing) throw createError('Banner no encontrado', 404);

  const s3KeyFull = `banners/${id}/full.webp`;
  const s3KeyThumb = `banners/${id}/thumb.webp`;

  // Actualización en R2
  try {
    await Promise.all([
      r2Client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: s3KeyFull,
        Body: imageData.data,
        ContentType: 'image/webp',
      })),
      r2Client.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: s3KeyThumb,
        Body: imageData.thumbnail,
        ContentType: 'image/webp',
      }))
    ]);
  } catch (error) {
    console.error('[R2] Error actualizando imagen de Banner en R2:', error);
  }

  const row = await prisma.banner.update({
    where: { id },
    data: {
      storageKey: s3KeyFull,
      storageThumbKey: s3KeyThumb,
      data: new Uint8Array(imageData.data),
      width: imageData.width,
      height: imageData.height,
      thumbnail: imageData.thumbnail ? new Uint8Array(imageData.thumbnail) : null,
      thumbWidth: imageData.thumbWidth ?? null,
      thumbHeight: imageData.thumbHeight ?? null,
      sizeBytes: imageData.sizeBytes,
      originalFilename: imageData.originalFilename ?? null,
      mimeType: 'image/webp',
    },
  });

  return toBannerWithMeta(row);
}

export async function deleteBanner(id: string): Promise<void> {
  const existing = await prisma.banner.findUnique({
    where: { id },
  });
  if (!existing) throw createError('Banner no encontrado', 404);

  await prisma.banner.delete({
    where: { id },
  });
}