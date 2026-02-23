/**
 * services/productImagesService.ts
 * Lógica de negocio para imágenes de producto.
 * Subdominio de products.
 */

import { v4 as uuidv4 } from 'uuid';
import { ProductImage, CreateProductImageDTO, UpdateProductImageDTO } from '../models/ProductImage';
import { createError } from '../middlewares/errorHandler';

const store: Map<string, ProductImage> = new Map();

export async function getImagesByProduct(productId: string): Promise<ProductImage[]> {
  return Array.from(store.values())
    .filter(img => img.productId === productId)
    .sort((a, b) => a.position - b.position);
}

export async function getImageById(id: string): Promise<ProductImage> {
  const image = store.get(id);
  if (!image) throw createError('Imagen no encontrada', 404);
  return image;
}

export async function createImage(dto: CreateProductImageDTO): Promise<ProductImage> {
  const now = new Date();
  const image: ProductImage = { ...dto, id: uuidv4(), createdAt: now, updatedAt: now };
  store.set(image.id, image);
  return image;
}

export async function updateImage(id: string, dto: UpdateProductImageDTO): Promise<ProductImage> {
  const existing = await getImageById(id);
  const updated: ProductImage = { ...existing, ...dto, updatedAt: new Date() };
  store.set(id, updated);
  return updated;
}

export async function deleteImage(id: string): Promise<void> {
  if (!store.has(id)) throw createError('Imagen no encontrada', 404);
  store.delete(id);
}
