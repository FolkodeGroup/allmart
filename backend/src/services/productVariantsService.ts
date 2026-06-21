/**
 * services/productVariantsService.ts
 * Lógica de negocio para variantes de producto usando el nuevo esquema relacional (ProductOption y ProductOptionValue).
 */

import { prisma } from '../config/prisma';
import { ProductVariant, CreateProductVariantDTO, UpdateProductVariantDTO } from '../models/ProductVariant';
import { createError } from '../middlewares/errorHandler';
import * as productsService from './productsService';

// Mapea la fila relacional de Prisma al DTO plano de variante que el frontend espera
function toVariant(row: any): ProductVariant {
  return {
    id: row.id,
    productId: row.productId,
    name: row.name,
    values: Array.isArray(row.values) ? row.values.map((v: any) => v.name) : [],
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getVariantsByProduct(productId: string): Promise<ProductVariant[]> {
  await productsService.getProductById(productId); // Valida que el producto exista
  
  const rows = await prisma.productOption.findMany({ 
    where: { productId },
    include: { values: true }
  });
  return rows.map(toVariant);
}

export async function getVariantById(productId: string, variantId: string): Promise<ProductVariant> {
  await productsService.getProductById(productId);
  
  const row = await prisma.productOption.findFirst({
    where: { id: variantId, productId },
    include: { values: true }
  });
  if (!row) throw createError('Variante no encontrada', 404);
  return toVariant(row);
}

export async function createVariant(
  productId: string,
  dto: Omit<CreateProductVariantDTO, 'productId'>
): Promise<ProductVariant> {
  await productsService.getProductById(productId);
  
  const valuesArray = Array.isArray(dto.values) ? dto.values : [];

  const row = await prisma.$transaction(async (tx) => {
    // 1. Crear el grupo de opción (Color, Talle, etc.)
    const option = await tx.productOption.create({
      data: {
        productId,
        name: dto.name,
        isActive: true,
      }
    });

    // 2. Crear los valores asociados
    if (valuesArray.length > 0) {
      await tx.productOptionValue.createMany({
        data: valuesArray.map((val: string) => ({
          optionId: option.id,
          name: val
        }))
      });
    }

    return tx.productOption.findUnique({
      where: { id: option.id },
      include: { values: true }
    });
  });

  return toVariant(row);
}

export async function updateVariant(
  productId: string,
  variantId: string,
  dto: UpdateProductVariantDTO
): Promise<ProductVariant> {
  await getVariantById(productId, variantId);
  
  const valuesArray = Array.isArray(dto.values) ? dto.values : undefined;

  const row = await prisma.$transaction(async (tx) => {
    // 1. Actualizar el nombre o estado del grupo de opción
    await tx.productOption.update({
      where: { id: variantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      }
    });

    // 2. Si se pasan nuevos valores, reescribir la tabla de valores
    if (valuesArray !== undefined) {
      await tx.productOptionValue.deleteMany({
        where: { optionId: variantId }
      });

      if (valuesArray.length > 0) {
        await tx.productOptionValue.createMany({
          data: valuesArray.map((val: string) => ({
            optionId: variantId,
            name: val
          }))
        });
      }
    }

    return tx.productOption.findUnique({
      where: { id: variantId },
      include: { values: true }
    });
  });

  return toVariant(row);
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  await getVariantById(productId, variantId);
  await prisma.productOption.delete({ where: { id: variantId } });
}