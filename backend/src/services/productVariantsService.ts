// import { Product } from './../../../frontend/src/types/index';
/**
 * services/productVariantsService.ts
 * Lógica de negocio para variantes de producto.
 * Subdominio de products.
 */

import { v4 as uuidv4 } from 'uuid';
import { ProductVariant, CreateProductVariantDTO, UpdateProductVariantDTO } from '../models/ProductVariant';
import { createError } from '../middlewares/errorHandler';
import * as productsService from './productsService';

const store: Map<string, ProductVariant> = new Map();

export async function getVariantsByProduct(productId: string): Promise<ProductVariant[]> {
  // 🔥 Validar que el producto exista (lanza 404 si no existe)
  await productsService.getProductById(productId);

  return Array.from(store.values()).filter(v => v.productId === productId);
}

export async function getVariantById(productId: string, variantId: string): Promise<ProductVariant> {
  await productsService.getProductById(productId); // Validar producto

  const variant = store.get(variantId);

  if (!variant || variant.productId !== productId) throw createError('Variante no encontrada', 404);
  return variant;
}

export async function createVariant(productId: string, dto: Omit<CreateProductVariantDTO, "productId">): Promise<ProductVariant> {

  await productsService.getProductById(productId);

  const now = new Date();
  
  const variant: ProductVariant = { ...dto, productId, id: uuidv4(), createdAt: now, updatedAt: now};
  store.set(variant.id, variant);
  return variant;
}

export async function updateVariant(productId: string, variantId: string, dto: UpdateProductVariantDTO): Promise<ProductVariant> {
  const existing = await getVariantById(productId, variantId);
  const updated: ProductVariant = { ...existing, ...dto, updatedAt: new Date() };
  store.set(variantId, updated);
  return updated;
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  await getVariantById(productId, variantId);

  store.delete(variantId);
}
