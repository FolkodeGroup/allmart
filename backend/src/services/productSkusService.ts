/**
 * backend/src/services/productSkusService.ts
 * Servicio para la gestión de combinaciones (SKUs) usando el esquema relacional normalizado.
 */

import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import * as productsService from './productsService';

export interface ProductSkuRow {
    id: string;
    productId: string;
    sku: string;
    attributes: Record<string, string>;
    images?: string[];
    stock: number;
    price?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Parsea y limpia de forma segura precios en formato string que puedan contener
 * separadores de miles con puntos o comas decimales (común en formatos latinoamericanos).
 */
export function parseSafePrice(price: any): number | undefined {
  if (price === undefined || price === null || price === '') {
    return undefined;
  }
  if (typeof price === 'number') {
    return price;
  }
  if (typeof price === 'string') {
    let clean = price.trim().replace(/[^0-9.,-]/g, '');
    
    // Formato es-AR (puntos para miles, coma para decimales)
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

    return {
        id: row.id,
        productId: row.productId,
        sku: row.sku,
        attributes,
        images,
        stock: row.stock,
        price,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

function ensureModelAvailable(): void {
    if (!prisma || !(prisma as any).productSku) {
        throw createError('El modelo ProductSku no está disponible en el cliente de Prisma.', 500);
    }
}

export async function getSkusByProduct(productId: string): Promise<ProductSkuRow[]> {
    ensureModelAvailable();
    const exists = await productsService.checkProductExists(productId);
    if (!exists) throw createError('Producto no encontrado', 404);
    
    const rows = await (prisma as any).productSku.findMany({
        where: { productId },
        include: {
            product: {
                select: { price: true }
            },
            skuValues: {
                include: {
                    optionValue: {
                        include: {
                            option: true
                        }
                    }
                }
            },
            productSkuImages: {
                select: { id: true }
            }
        }
    });
    return rows.map(toDto);
}

export async function getSkuById(productId: string, skuId: string): Promise<ProductSkuRow> {
    ensureModelAvailable();
    const exists = await productsService.checkProductExists(productId);
    if (!exists) throw createError('Producto no encontrado', 404);
    
    const row = await (prisma as any).productSku.findFirst({
        where: { id: skuId, productId },
        include: {
            product: {
                select: { price: true }
            },
            skuValues: {
                include: {
                    optionValue: {
                        include: {
                            option: true
                        }
                    }
                }
            },
            productSkuImages: {
                select: { id: true }
            }
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
    
    const exists = await productsService.checkProductExists(productId);
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

    const attrs = dto.attributes ?? {};

    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
            where: { id: productId },
            select: { price: true }
        });
        if (!product) throw createError('Producto no encontrado', 404);
        const originalPrice = Number(product.price);

        const parsedPrice = dto.price !== undefined ? parseSafePrice(dto.price) : undefined;

        const newSku = await (tx as any).productSku.create({
            data: {
                productId,
                sku: skuCode,
                stock: dto.stock ?? 0,
                price: parsedPrice !== undefined && parsedPrice !== null && parsedPrice !== 0 ? parsedPrice : originalPrice,
                isActive: true
            }
        });

        // Optimización: Carga inicial de todas las opciones para realizar validación en memoria y evitar ráfagas de consultas a la BD
        const existingOptions = await tx.productOption.findMany({
            where: { productId },
            include: { values: true }
        });

        for (const [optionName, valueName] of Object.entries(attrs)) {
            let option = existingOptions.find(o => o.name === optionName);
            if (!option) {
                option = await tx.productOption.create({
                    data: { productId, name: optionName, isActive: true },
                    include: { values: true }
                });
                existingOptions.push(option);
            }

            let optionValue = option.values.find(v => v.name === valueName);
            if (!optionValue) {
                optionValue = await tx.productOptionValue.create({
                    data: { optionId: option.id, name: valueName }
                });
                option.values.push(optionValue);
            }

            await tx.productSkuValue.create({
                data: {
                    skuId: newSku.id,
                    optionValueId: optionValue.id
                }
            });
        }

        const populated = await (tx as any).productSku.findUnique({
            where: { id: newSku.id },
            include: {
                product: {
                    select: { price: true }
                },
                skuValues: {
                    include: {
                        optionValue: {
                            include: {
                                option: true
                              }
                        }
                    }
                },
                productSkuImages: {
                    select: { id: true }
                }
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
    const exists = await productsService.checkProductExists(productId);
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

    return await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
            where: { id: productId },
            select: { price: true }
        });
        const originalPrice = product ? Number(product.price) : 0;

        let finalPrice = dto.price !== undefined ? parseSafePrice(dto.price) : undefined;
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

        if (dto.attributes !== undefined) {
            await tx.productSkuValue.deleteMany({
                where: { skuId }
            });

            // Optimización: Reducción drástica del número de consultas en memoria
            const existingOptions = await tx.productOption.findMany({
                where: { productId },
                include: { values: true }
            });

            for (const [optionName, valueName] of Object.entries(dto.attributes)) {
                let option = existingOptions.find(o => o.name === optionName);
                if (!option) {
                    option = await tx.productOption.create({
                        data: { productId, name: optionName, isActive: true },
                        include: { values: true }
                    });
                    existingOptions.push(option);
                }

                let optionValue = option.values.find(v => v.name === valueName);
                if (!optionValue) {
                    optionValue = await tx.productOptionValue.create({
                        data: { optionId: option.id, name: valueName }
                    });
                    option.values.push(optionValue);
                }

                await tx.productSkuValue.create({
                    data: {
                        skuId,
                        optionValueId: optionValue.id
                    }
                });
            }
        }

        const populated = await (tx as any).productSku.findUnique({
            where: { id: skuId },
            include: {
                product: {
                    select: { price: true }
                },
                skuValues: {
                    include: {
                        optionValue: {
                            include: {
                                option: true
                            }
                        }
                    }
                },
                productSkuImages: {
                    select: { id: true }
                }
            }
        });

        return toDto(populated);
    });
}

export async function deleteSku(productId: string, skuId: string): Promise<void> {
    ensureModelAvailable();
    const result = await (prisma as any).productSku.deleteMany({
        where: {
            id: skuId,
            productId
        }
    });
    if (result.count === 0) {
        throw createError('SKU no encontrado', 404);
    }
}