/**
 * backend/src/services/productSkusService.ts
 * Servicio para gestión de SKUs con Logs de Diagnóstico integrados para depuración.
 */

import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

export interface Sku {
  id: string;
  productId: string;
  sku: string;
  stock: number;
  price?: number;
  isActive: boolean;
}

export interface VariantChild {
  id: string;
  sku?: string;
  attributes?: Record<string, string>;
  stock?: number;
  images?: string[];
  price?: number;
}

export interface ProductSkuRow {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>;
  variant?: string;
  images?: string[];
  stock: number;
  price?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function parseSafePrice(price: any): number | undefined {
  if (price === undefined || price === null || price === '') {
    return undefined;
  }
  if (typeof price === 'number') {
    return price;
  }
  if (typeof price === 'string') {
    let clean = price.trim().replace(/[^0-9.,-]/g, '');
    
    if (clean.includes('.') && clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(/,/g, '.');
    } else if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts[1].length === 3 && parts[0].length <= 3) {
        clean = clean.replace(/\./g, '');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(/,/g, '.');
    }
    
    const parsed = parseFloat(clean);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toDto(row: any): ProductSkuRow {
  const attributes: Record<string, string> = {};
  
  if (Array.isArray(row.skuValues)) {
    row.skuValues.forEach((sv: any) => {
      const optName = sv.optionValue?.option?.name;
      const valName = sv.optionValue?.name;
      if (optName && valName) {
        attributes[optName] = valName;
      }
    });
  }

  const images = Array.isArray(row.productSkuImages)
    ? row.productSkuImages.map((img: any) => `/api/images/sku/${img.id}`)
    : [];

  let price = row.price === null || row.price === undefined ? undefined : Number(row.price);
  if ((price === undefined || price === 0) && row.product) {
    price = Number(row.product.price);
  }

  const variant = Object.values(attributes).join(' / ') || '—';

  return {
    id: row.id,
    productId: row.productId,
    sku: row.sku,
    attributes,
    variant,
    images,
    stock: row.stock,
    price,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as any;
}

function ensureModelAvailable(): void {
  if (!prisma || !(prisma as any).productSku) {
    throw createError('El modelo ProductSku no está disponible en el cliente de Prisma.', 500);
  }
}

export async function getSkusByProduct(productId: string): Promise<ProductSkuRow[]> {
  ensureModelAvailable();
  const exists = await prisma.product.findUnique({ where: { id: productId } });
  if (!exists) throw createError('Producto no encontrado', 404);
  
  const rows = await (prisma as any).productSku.findMany({
    where: { productId },
    include: {
      product: { select: { price: true } },
      skuValues: { include: { optionValue: { include: { option: true } } } },
      productSkuImages: { select: { id: true } }
    }
  });

  const mapped = rows.map(toDto);

  return mapped;
}

export async function getSkuById(productId: string, skuId: string): Promise<ProductSkuRow> {
  ensureModelAvailable();
  const exists = await prisma.product.findUnique({ where: { id: productId } });
  if (!exists) throw createError('Producto no encontrado', 404);
  
  const row = await (prisma as any).productSku.findFirst({
    where: { id: skuId, productId },
    include: {
      product: { select: { price: true } },
      skuValues: { include: { optionValue: { include: { option: true } } } },
      productSkuImages: { select: { id: true } }
    }
  });
  if (!row) throw createError('SKU no encontrado', 404);
  return toDto(row);
}

export async function createSku(
  productId: string, 
  dto: { sku?: string; attributes?: Record<string, string>; stock?: number; price?: number }
): Promise<ProductSkuRow> {
  ensureModelAvailable();
  

  const exists = await prisma.product.findUnique({ where: { id: productId } });
  if (!exists) throw createError('Producto no encontrado', 404);

  const skuCode = dto.sku?.trim() || '';
  if (!skuCode) {
    throw createError('El SKU es obligatorio', 400);
  }

  const skuExists = await (prisma as any).productSku.findUnique({
    where: { sku: skuCode }
  });
  if (skuExists) {
    throw createError('El SKU ya está en uso', 409);
  }

  const parsedPrice = dto.price !== undefined ? parseSafePrice(dto.price) : undefined;
  if (parsedPrice !== undefined && parsedPrice !== null && parsedPrice < 0) {
    throw createError('El precio de la variante no puede ser negativo', 400);
  }
  if (dto.stock !== undefined && dto.stock < 0) {
    throw createError('El stock de la variante no puede ser negativo', 400);
  }

  const attrs = dto.attributes || (dto as any).attributeValues || (dto as any).options || (dto as any).specs || {};

  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { price: true }
    });
    if (!product) throw createError('Producto no encontrado', 404);
    const originalPrice = Number(product.price);

    const newSku = await (tx as any).productSku.create({
      data: {
        productId,
        sku: skuCode,
        stock: dto.stock ?? 0,
        price: parsedPrice !== undefined && parsedPrice !== null && parsedPrice !== 0 ? parsedPrice : originalPrice,
        isActive: true
      }
    });

    for (const [optionName, valueName] of Object.entries(attrs)) {
      
      let option = await tx.productOption.findUnique({
        where: { productId_name: { productId, name: optionName } }
      });
      if (!option) {
        option = await tx.productOption.create({
          data: { productId, name: optionName, isActive: true }
        });
      }

      let optionValue = await tx.productOptionValue.findUnique({
        where: { optionId_name: { optionId: option.id, name: valueName as string } }
      });
      if (!optionValue) {
        optionValue = await tx.productOptionValue.create({
          data: { optionId: option.id, name: valueName as string }
        });
      }

      await tx.productSkuValue.create({
        data: { skuId: newSku.id, optionValueId: optionValue.id }
      });
    }

    const populated = await (tx as any).productSku.findUnique({
      where: { id: newSku.id },
      include: {
        product: { select: { price: true } },
        skuValues: { include: { optionValue: { include: { option: true } } } },
        productSkuImages: { select: { id: true } }
      }
    });

    return toDto(populated);
  });
}

export async function updateSku(
  productId: string, 
  skuId: string, 
  dto: { sku?: string; attributes?: Record<string, string>; stock?: number; price?: number; isActive?: boolean }
): Promise<ProductSkuRow> {
  ensureModelAvailable();
  const exists = await prisma.product.findUnique({ where: { id: productId } });
  if (!exists) throw createError('Producto no encontrado', 404);

  const skuRow = await (prisma as any).productSku.findFirst({
    where: { id: skuId, productId },
    select: { sku: true }
  });
  if (!skuRow) throw createError('SKU no encontrado', 404);

  const skuCode = dto.sku?.trim() ?? skuRow.sku;

  if (dto.sku && dto.sku !== skuRow.sku) {
    const skuExists = await (prisma as any).productSku.findUnique({
      where: { sku: skuCode }
    });
    if (skuExists) {
      throw createError('El SKU ya está en uso', 409);
    }
  }

  const parsedPrice = dto.price !== undefined ? parseSafePrice(dto.price) : undefined;
  if (parsedPrice !== undefined && parsedPrice !== null && parsedPrice < 0) {
    throw createError('El precio de la variante no puede ser negativo', 400);
  }
  if (dto.stock !== undefined && dto.stock < 0) {
    throw createError('El stock de la variante no puede ser negativo', 400);
  }

  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { price: true }
    });
    const originalPrice = product ? Number(product.price) : 0;

    let finalPrice = parsedPrice;
    if (finalPrice === null || finalPrice === 0) {
      finalPrice = originalPrice;
    }

    const dataToUpdate: any = {
      sku: skuCode,
      stock: dto.stock !== undefined ? dto.stock : undefined,
      price: dto.price !== undefined ? finalPrice : undefined,
      isActive: dto.isActive !== undefined ? dto.isActive : undefined,
    };

    await (tx as any).productSku.update({
      where: { id: skuId },
      data: dataToUpdate
    });

    const attrs = dto.attributes || (dto as any).attributeValues || (dto as any).options || (dto as any).specs;
    

    if (attrs !== undefined) {
      await tx.productSkuValue.deleteMany({
        where: { skuId }
      });

      for (const [optionName, valueName] of Object.entries(attrs)) {
        let option = await tx.productOption.findUnique({
          where: { productId_name: { productId, name: optionName } }
        });
        if (!option) {
          option = await tx.productOption.create({
            data: { productId, name: optionName, isActive: true }
          });
        }

        let optionValue = await tx.productOptionValue.findUnique({
          where: { optionId_name: { optionId: option.id, name: valueName as string } }
        });
        if (!optionValue) {
          optionValue = await tx.productOptionValue.create({
            data: { optionId: option.id, name: valueName as string }
          });
        }

        await tx.productSkuValue.create({
          data: { skuId: skuId, optionValueId: optionValue.id }
        });
      }
    }

    const populated = await (tx as any).productSku.findUnique({
      where: { id: skuId },
      include: {
        product: { select: { price: true } },
        skuValues: { include: { optionValue: { include: { option: true } } } },
        productSkuImages: { select: { id: true } }
      }
    });

    return toDto(populated);
  });
}

export async function deleteSku(productId: string, skuId: string): Promise<void> {
  ensureModelAvailable();
  const result = await (prisma as any).productSku.deleteMany({
    where: { id: skuId, productId }
  });
  if (result.count === 0) {
    throw createError('SKU no encontrado', 404);
  }
}