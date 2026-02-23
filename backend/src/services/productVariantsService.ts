/**
 * services/productVariantsService.ts
 * Lógica de negocio para variantes de producto.
 * Subdominio de products.
 */

import { v4 as uuidv4 } from 'uuid';
import { ProductVariant, CreateProductVariantDTO, UpdateProductVariantDTO } from '../models/ProductVariant';
import { createError } from '../middlewares/errorHandler';

const store: Map<string, ProductVariant> = new Map();

export async function getVariantsByProduct(productId: string): Promise<ProductVariant[]> {
  return Array.from(store.values()).filter(v => v.productId === productId);
}

export async function getVariantById(id: string): Promise<ProductVariant> {
  const variant = store.get(id);
  if (!variant) throw createError('Variante no encontrada', 404);
  return variant;
}

export async function createVariant(dto: CreateProductVariantDTO): Promise<ProductVariant> {
  const now = new Date();
  const variant: ProductVariant = { ...dto, id: uuidv4(), createdAt: now, updatedAt: now };
  store.set(variant.id, variant);
  return variant;
}

export async function updateVariant(id: string, dto: UpdateProductVariantDTO): Promise<ProductVariant> {
  const existing = await getVariantById(id);
  const updated: ProductVariant = { ...existing, ...dto, updatedAt: new Date() };
  store.set(id, updated);
  return updated;
}

export async function deleteVariant(id: string): Promise<void> {
  if (!store.has(id)) throw createError('Variante no encontrada', 404);
  store.delete(id);
}
