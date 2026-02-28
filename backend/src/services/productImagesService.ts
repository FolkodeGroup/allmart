/**
 * services/productImagesService.ts
 * Lógica de negocio para imágenes de producto.
 * Las imágenes se almacenan como JSONB en el campo `images` del producto.
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/prisma';
import { ProductImage, CreateProductImageDTO, UpdateProductImageDTO } from '../models/ProductImage';
import { createError } from '../middlewares/errorHandler';

interface StoredImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

async function getProductImages(productId: string): Promise<StoredImage[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { images: true },
  });
  if (!product) throw createError('Producto no encontrado', 404);
  return ((product.images as unknown) as StoredImage[]) ?? [];
}

function toProductImage(img: StoredImage, productId: string): ProductImage {
  return {
    id: img.id,
    productId,
    url: img.url,
    altText: img.altText,
    position: img.position,
    createdAt: new Date(img.createdAt),
    updatedAt: new Date(img.updatedAt),
  };
}

export async function getImagesByProduct(productId: string): Promise<ProductImage[]> {
  const images = await getProductImages(productId);
  return images
    .sort((a, b) => a.position - b.position)
    .map((img) => toProductImage(img, productId));
}

export async function getImageById(id: string): Promise<ProductImage> {
  // Buscar en todos los productos (operación de búsqueda general)
  const product = await prisma.product.findFirst({
    where: {
      images: { path: ['$[*].id'], array_contains: id } as never,
    },
    select: { id: true, images: true },
  });
  if (!product) throw createError('Imagen no encontrada', 404);

  const images = (product.images as unknown) as StoredImage[];
  const img = images.find((i) => i.id === id);
  if (!img) throw createError('Imagen no encontrada', 404);

  return toProductImage(img, product.id);
}

export async function createImage(dto: CreateProductImageDTO): Promise<ProductImage> {
  const images = await getProductImages(dto.productId);

  const now = new Date().toISOString();
  const newImage: StoredImage = {
    id: uuidv4(),
    url: dto.url,
    altText: dto.altText,
    position: dto.position,
    createdAt: now,
    updatedAt: now,
  };

  images.push(newImage);

  await prisma.product.update({
    where: { id: dto.productId },
    data: { images: images as never },
  });

  return toProductImage(newImage, dto.productId);
}

export async function updateImage(id: string, dto: UpdateProductImageDTO): Promise<ProductImage> {
  const existing = await getImageById(id);
  const images = await getProductImages(existing.productId);

  const idx = images.findIndex((i) => i.id === id);
  if (idx === -1) throw createError('Imagen no encontrada', 404);

  const updated: StoredImage = {
    ...images[idx],
    ...(dto.url !== undefined && { url: dto.url }),
    ...(dto.altText !== undefined && { altText: dto.altText }),
    ...(dto.position !== undefined && { position: dto.position }),
    updatedAt: new Date().toISOString(),
  };
  images[idx] = updated;

  await prisma.product.update({
    where: { id: existing.productId },
    data: { images: images as never },
  });

  return toProductImage(updated, existing.productId);
}

export async function deleteImage(id: string): Promise<void> {
  const existing = await getImageById(id);
  const images = await getProductImages(existing.productId);

  const filtered = images.filter((i) => i.id !== id);

  await prisma.product.update({
    where: { id: existing.productId },
    data: { images: filtered as never },
  });
}

