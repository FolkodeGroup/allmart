/**
 * services/productVariantsService.ts
 * Lógica de negocio para variantes de producto usando un Diff inteligente no destructivo
 * para proteger las relaciones relacionales de SKU ante eliminaciones en cascada.
 */

import { prisma } from '../config/prisma';
import { ProductVariant, CreateProductVariantDTO, UpdateProductVariantDTO } from '../models/ProductVariant';
import { createError } from '../middlewares/errorHandler';
import * as productsService from './productsService';

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
  const exists = await productsService.checkProductExists(productId);
  if (!exists) throw createError('Producto no encontrado', 404);
  
  const rows = await prisma.productOption.findMany({ 
    where: { productId },
    include: { values: true }
  });
  return rows.map(toVariant);
}

export async function getVariantById(productId: string, variantId: string): Promise<ProductVariant> {
  const exists = await productsService.checkProductExists(productId);
  if (!exists) throw createError('Producto no encontrado', 404);
  
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
  const exists = await productsService.checkProductExists(productId);
  if (!exists) throw createError('Producto no encontrado', 404);
  
  const valuesArray = Array.isArray(dto.values) ? dto.values : [];

  const row = await prisma.$transaction(async (tx) => {
    const option = await tx.productOption.create({
      data: {
        productId,
        name: dto.name,
        isActive: true,
      }
    });

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
  const exists = await productsService.checkProductExists(productId);
  if (!exists) throw createError('Producto no encontrado', 404);

  const optionExists = await prisma.productOption.count({
    where: { id: variantId, productId }
  });
  if (optionExists === 0) throw createError('Variante no encontrada', 404);
  
  const valuesArray = Array.isArray(dto.values) ? dto.values : undefined;

  const row = await prisma.$transaction(async (tx) => {
    await tx.productOption.update({
      where: { id: variantId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      }
    });

    if (valuesArray !== undefined) {
      // 1. Obtener valores que ya existen actualmente en la base de datos
      const existingValues = await tx.productOptionValue.findMany({
        where: { optionId: variantId }
      });

      const incomingNames = valuesArray.map(v => v.trim()).filter(Boolean);

      // 2. Identificar qué valores fueron eliminados por el usuario
      const toDelete = existingValues.filter(ev => !incomingNames.includes(ev.name));
      if (toDelete.length > 0) {
        await tx.productOptionValue.deleteMany({
          where: {
            id: { in: toDelete.map(d => d.id) }
          }
        });
      }

      // 3. Identificar qué valores son nuevos y deben crearse
      const existingNames = existingValues.map(ev => ev.name);
      const toCreate = incomingNames.filter(name => !existingNames.includes(name));
      if (toCreate.length > 0) {
        await tx.productOptionValue.createMany({
          data: toCreate.map(name => ({
            optionId: variantId,
            name
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
  const result = await prisma.productOption.deleteMany({
    where: {
      id: variantId,
      productId
    }
  });
  if (result.count === 0) {
    throw createError('Variante no encontrada', 404);
  }
}