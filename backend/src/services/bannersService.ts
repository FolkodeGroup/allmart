/**
 * services/bannersService.ts
 * Lógica de negocio para el dominio de banners usando Prisma Client.
 */

import { prisma } from '../config/prisma';
import { BannerWithImageMeta, CreateBannerDTO, UpdateBannerDTO } from '../models/Banner';
import { createError } from '../middlewares/errorHandler';

// Mapea el resultado de Prisma al tipo BannerWithImageMeta
function toBannerWithMeta(row: any): BannerWithImageMeta {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    displayOrder: row.displayOrder,
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
  };
}

// Para respuestas públicas sin datos binarios
function toBannerPublic(row: any): any {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
    imageUrl: `/api/images/banners/${row.id}`,
    thumbUrl: `/api/images/banners/${row.id}/thumb`,
    altText: row.altText ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAllBanners(): Promise<BannerWithImageMeta[]> {
  const rows = await prisma.banner.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return rows.map(toBannerWithMeta);
}

export async function getActiveBannersPublic(): Promise<any[]> {
  const rows = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
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
  return { data: row.data as Buffer, width: row.width, height: row.height };
}

export async function getBannerThumbnail(id: string): Promise<{ data: Buffer; width: number; height: number }> {
  const row = await prisma.banner.findUnique({
    where: { id },
    select: { thumbnail: true, thumbWidth: true, thumbHeight: true },
  });
  if (!row) throw createError('Banner no encontrado', 404);
  if (!row.thumbnail) throw createError('Miniatura no disponible', 404);
  return { 
    data: row.thumbnail as Buffer, 
    width: row.thumbWidth ?? 0, 
    height: row.thumbHeight ?? 0 
  };
}

export async function createBanner(
  title: string,
  description: string | undefined,
  altText: string | undefined,
  displayOrder: number,
  isActive: boolean,
  imageData: {
    data: Buffer;
    width: number;
    height: number;
    thumbnail?: Buffer;
    thumbWidth?: number;
    thumbHeight?: number;
    sizeBytes: number;
    originalFilename?: string;
  },
): Promise<BannerWithImageMeta> {
  if (!title.trim()) {
    throw createError('El título es requerido', 400);
  }

  const row = await prisma.banner.create({
    data: {
      title,
      description: description ?? null,
      altText: altText ?? null,
      displayOrder,
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
    },
  });

  return toBannerWithMeta(row);
}

export async function updateBanner(
  id: string,
  updates: Partial<{
    title: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    altText: string | null;
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
      displayOrder: updates.displayOrder ?? existing.displayOrder,
      isActive: updates.isActive ?? existing.isActive,
      altText: updates.altText !== undefined ? updates.altText : existing.altText,
    },
  });

  return toBannerWithMeta(row);
}

export async function updateBannerImage(
  id: string,
  imageData: {
    data: Buffer;
    width: number;
    height: number;
    thumbnail?: Buffer;
    thumbWidth?: number;
    thumbHeight?: number;
    sizeBytes: number;
    originalFilename?: string;
  },
): Promise<BannerWithImageMeta> {
  const existing = await prisma.banner.findUnique({
    where: { id },
  });
  if (!existing) throw createError('Banner no encontrado', 404);

  const row = await prisma.banner.update({
    where: { id },
    data: {
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

export async function reorderBanners(bannerIds: string[]): Promise<BannerWithImageMeta[]> {
  const updates = bannerIds.map((id, index) =>
    prisma.banner.update({
      where: { id },
      data: { displayOrder: index },
    })
  );

  const results = await Promise.all(updates);
  return results.map(toBannerWithMeta);
}

