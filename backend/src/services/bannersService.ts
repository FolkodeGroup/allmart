import { prisma } from '../config/prisma';
import { BannerWithImageMeta } from '../models/Banner';
import { createError } from '../middlewares/errorHandler';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../config/r2';
import { env } from '../config/env';

function toBannerWithMeta(row: any): BannerWithImageMeta {
  return {
    id: row.id, title: row.title, description: row.description ?? undefined,
    isPinned: row.isPinned, isActive: row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt,
    width: row.width, height: row.height, thumbWidth: row.thumbWidth ?? undefined,
    thumbHeight: row.thumbHeight ?? undefined, sizeBytes: row.sizeBytes,
    originalFilename: row.originalFilename ?? undefined, altText: row.altText ?? undefined,
    filterConfig: row.filterConfig ?? undefined,
  };
}

export async function getAllBanners(): Promise<BannerWithImageMeta[]> {
  const rows = await prisma.banner.findMany({ orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] });
  return rows.map(toBannerWithMeta);
}

export async function getActiveBannersPublic(): Promise<any[]> {
  const rows = await prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] });
  return rows.map(r => ({
    id: r.id, title: r.title, description: r.description ?? undefined,
    imageUrl: `/api/images/banners/${r.id}`, thumbUrl: `/api/images/banners/${r.id}/thumb`,
    filterConfig: r.filterConfig ?? {},
  }));
}

export async function getBannerById(id: string): Promise<BannerWithImageMeta> {
  const row = await prisma.banner.findUnique({ where: { id } });
  if (!row) throw createError('Banner no encontrado', 404);
  return toBannerWithMeta(row);
}

export async function createBanner(title: string, description: string | undefined, altText: string | undefined, isPinned: boolean, isActive: boolean, imageData: any, filterConfig: Record<string, unknown>) {
  if (!title.trim()) throw createError('El título es requerido', 400);

  const tempRow = await prisma.banner.create({
    data: {
      title, description: description ?? null, altText: altText ?? null,
      isPinned, isActive,
      width: imageData.width, height: imageData.height,
      thumbWidth: imageData.thumbWidth ?? null, thumbHeight: imageData.thumbHeight ?? null,
      sizeBytes: imageData.sizeBytes, originalFilename: imageData.originalFilename ?? null,
      mimeType: 'image/webp', filterConfig: (filterConfig ?? {}) as any,
    },
  });

  const s3KeyFull = `banners/${tempRow.id}/full.webp`;
  const s3KeyThumb = `banners/${tempRow.id}/thumb.webp`;

  try {
    const uploads = [
      r2Client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: s3KeyFull, Body: imageData.data, ContentType: 'image/webp' }))
    ];
    if (imageData.thumbnail) {
      uploads.push(r2Client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: s3KeyThumb, Body: imageData.thumbnail, ContentType: 'image/webp' })));
    }
    await Promise.all(uploads);
    
    const finalRow = await prisma.banner.update({
      where: { id: tempRow.id },
      data: { storageKey: s3KeyFull, storageThumbKey: s3KeyThumb }
    });
    return toBannerWithMeta(finalRow);
  } catch (error) {
    console.error('[R2] Error Banner:', error);
    return toBannerWithMeta(tempRow);
  }
}

export async function updateBannerImage(id: string, imageData: any) {
  const s3KeyFull = `banners/${id}/full.webp`;
  const s3KeyThumb = `banners/${id}/thumb.webp`;

  try {
    await Promise.all([
      r2Client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: s3KeyFull, Body: imageData.data, ContentType: 'image/webp' })),
      r2Client.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: s3KeyThumb, Body: imageData.thumbnail, ContentType: 'image/webp' }))
    ]);
  } catch (error) {
    console.error('[R2] Error Update Banner:', error);
  }

  const row = await prisma.banner.update({
    where: { id },
    data: {
      storageKey: s3KeyFull, storageThumbKey: s3KeyThumb,
      width: imageData.width, height: imageData.height,
      thumbWidth: imageData.thumbWidth, thumbHeight: imageData.thumbHeight,
      sizeBytes: imageData.sizeBytes, originalFilename: imageData.originalFilename
    },
  });
  return toBannerWithMeta(row);
}

export async function deleteBanner(id: string): Promise<void> {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw createError('Banner no encontrado', 404);
  await prisma.banner.delete({ where: { id } });
}

export async function getBannerImageData(id: string): Promise<{ data: Buffer; width: number; height: number }> {
    const row = await prisma.banner.findUnique({ where: { id }, select: { width: true, height: true, storageKey: true } });
    if (row?.storageKey) return { data: Buffer.alloc(0), width: row.width, height: row.height };
    throw createError('No disponible', 404);
}

export async function getBannerThumbnail(id: string): Promise<{ data: Buffer; width: number; height: number }> {
    const row = await prisma.banner.findUnique({ where: { id }, select: { thumbWidth: true, thumbHeight: true, storageThumbKey: true } });
    if (row?.storageThumbKey) return { data: Buffer.alloc(0), width: row.thumbWidth ?? 0, height: row.thumbHeight ?? 0 };
    throw createError('No disponible', 404);
}