/**
 * services/bannersService.ts
 * Lógica de negocio para el dominio de banners usando Prisma Client.
 */

import { prisma } from '../config/prisma';
import { Banner, CreateBannerDTO, UpdateBannerDTO } from '../models/Banner';
import { createError } from '../middlewares/errorHandler';

// Mapea el resultado de Prisma al tipo Banner del proyecto
function toBanner(row: any): Banner {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.imageUrl,
    link: row.link ?? undefined,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAllBanners(): Promise<Banner[]> {
  const rows = await prisma.banner.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return rows.map(toBanner);
}

export async function getActiveBanners(): Promise<Banner[]> {
  const rows = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
  return rows.map(toBanner);
}

export async function getBannerById(id: string): Promise<Banner> {
  const row = await prisma.banner.findUnique({
    where: { id },
  });
  if (!row) throw createError('Banner no encontrado', 404);
  return toBanner(row);
}

export async function createBanner(dto: CreateBannerDTO): Promise<Banner> {
  if (!dto.title || !dto.imageUrl) {
    throw createError('Campos requeridos: title, imageUrl', 400);
  }

  const row = await prisma.banner.create({
    data: {
      title: dto.title,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl,
      link: dto.link ?? null,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    },
  });

  return toBanner(row);
}

export async function updateBanner(id: string, dto: UpdateBannerDTO): Promise<Banner> {
  const existing = await prisma.banner.findUnique({
    where: { id },
  });
  if (!existing) throw createError('Banner no encontrado', 404);

  const row = await prisma.banner.update({
    where: { id },
    data: {
      title: dto.title ?? existing.title,
      description: dto.description !== undefined ? dto.description : existing.description,
      imageUrl: dto.imageUrl ?? existing.imageUrl,
      link: dto.link !== undefined ? dto.link : existing.link,
      displayOrder: dto.displayOrder ?? existing.displayOrder,
      isActive: dto.isActive ?? existing.isActive,
    },
  });

  return toBanner(row);
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

export async function reorderBanners(bannerIds: string[]): Promise<Banner[]> {
  const updates = bannerIds.map((id, index) =>
    prisma.banner.update({
      where: { id },
      data: { displayOrder: index },
    })
  );

  const results = await Promise.all(updates);
  return results.map(toBanner);
}
