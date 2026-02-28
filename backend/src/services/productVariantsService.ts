/**
 * services/productVariantsService.ts
 * Lógica de negocio para variantes de producto usando Prisma Client.
 */

import { prisma } from '../config/prisma';
import { ProductVariant, CreateProductVariantDTO, UpdateProductVariantDTO } from '../models/ProductVariant';
import { createError } from '../middlewares/errorHandler';
import * as productsService from './productsService';

// Mapea la fila Prisma al tipo ProductVariant del proyecto
function toVariant(row: {
  id: string;
  productId: string;
  name: string;
  values: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ProductVariant {
  return {
    id: row.id,
    productId: row.productId,
    name: row.name,
    values: row.values as string[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getVariantsByProduct(productId: string): Promise<ProductVariant[]> {
  await productsService.getProductById(productId); // valida que el producto exista
  const rows = await prisma.productVariant.findMany({ where: { productId } });
  return rows.map(toVariant);
}

export async function getVariantById(productId: string, variantId: string): Promise<ProductVariant> {
  await productsService.getProductById(productId);
  const row = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!row) throw createError('Variante no encontrada', 404);
  return toVariant(row);
}

export async function createVariant(
  productId: string,
  dto: Omit<CreateProductVariantDTO, 'productId'>
): Promise<ProductVariant> {
  await productsService.getProductById(productId);
  const row = await prisma.productVariant.create({
    data: {
      productId,
      name: dto.name,
      values: dto.values as never,
    },
  });
  return toVariant(row);
}

export async function updateVariant(
  productId: string,
  variantId: string,
  dto: UpdateProductVariantDTO
): Promise<ProductVariant> {
  await getVariantById(productId, variantId);
  const row = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.values !== undefined && { values: dto.values as never }),
    } as never,
  });
  return toVariant(row);
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  await getVariantById(productId, variantId);
  await prisma.productVariant.delete({ where: { id: variantId } });
}

