/**
 * Adapter service that reuses the existing ProductVariant logic to store
 * combination (SKU) entries without schema changes.
 *
 * Strategy:
 * - Create ProductVariant rows with name='__combination__' and values = [ JSON.stringify({ sku, attributes, stock, price }) ]
 * - List/read operations read ProductVariant rows with that name and parse payload.
 *
 * This is an adapter to avoid changing DB schema while the proper ProductSku model
 * is planned.
 */

import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import * as productsService from './productsService';

export interface ProductSkuRow {
    id: string;
    productId: string;
    sku: string;
    attributes: unknown;
    images?: string[];
    stock: number;
    price?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

function toDto(row: any): ProductSkuRow {
    // Extract images from attributes if present (store as top-level for frontend convenience)
    let images: string[] | undefined = undefined;
    let attrs = row.attributes ?? {};
    try {
        if (attrs && typeof attrs === 'object' && Array.isArray((attrs as any).images)) {
            images = (attrs as any).images;
            // create a shallow copy without images
            const { images: _img, ...rest } = attrs as any;
            attrs = rest;
        }
    } catch {
        // ignore
    }
    return {
        id: row.id,
        productId: row.productId,
        sku: row.sku,
        attributes: attrs,
        images,
        stock: row.stock,
        price: row.price === null ? undefined : Number(row.price),
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

function ensureModelAvailable(): void {
    // If the generated Prisma client doesn't include `productSku`, accessing it will
    // throw an unclear runtime error. Provide a helpful message instead.
    // @ts-ignore
    if (!prisma || !(prisma as any).productSku) {
        throw createError('ProductSku model not available in Prisma client. Run `npx prisma generate` and restart the backend.', 500);
    }
}

export async function getSkusByProduct(productId: string): Promise<ProductSkuRow[]> {
    ensureModelAvailable();
    await productsService.getProductById(productId);
    // @ts-ignore
    const rows = await (prisma as any).productSku.findMany({ where: { productId } });
    return rows.map(toDto);
}

export async function getSkuById(productId: string, skuId: string): Promise<ProductSkuRow> {
    ensureModelAvailable();
    await productsService.getProductById(productId);
    // @ts-ignore
    const row = await (prisma as any).productSku.findFirst({ where: { id: skuId, productId } });
    if (!row) throw createError('SKU no encontrado', 404);
    return toDto(row);
}

export async function createSku(productId: string, dto: { sku?: string; attributes?: Record<string, any>; stock?: number; price?: number }): Promise<ProductSkuRow> {
    ensureModelAvailable();
    await productsService.getProductById(productId);
    // Server-side validation: SKU must not equal product SKU, price valid, images present in attributes
    const product = await productsService.getProductById(productId);
    if (dto.sku && product.sku && dto.sku === product.sku) {
        throw createError('El SKU de la combinación no puede ser igual al SKU del producto base', 400, ['sku']);
    }
    if (dto.price !== undefined && dto.price !== null) {
        const priceNum = Number(dto.price);
        if (Number.isNaN(priceNum) || priceNum < 0) {
            throw createError('Precio inválido para la combinación', 400, ['price']);
        }
    }
    const attrsToSave = { ...(dto.attributes ?? {}) } as Record<string, any>;
    const providedImages = (dto as any).images ?? attrsToSave.images;
    if (!providedImages || (Array.isArray(providedImages) && providedImages.filter(Boolean).length === 0)) {
        // If no images provided, reject creation
        throw createError('La combinación debe incluir al menos una imagen', 400, ['images']);
    }
    // Merge images into attributes if provided in dto.images
    if ((dto as any).images && Array.isArray((dto as any).images)) {
        attrsToSave.images = (dto as any).images;
    }
    const row = await (prisma as any).productSku.create({
        data: {
            productId,
            sku: dto.sku ?? '',
            attributes: attrsToSave,
            stock: dto.stock ?? 0,
            ...(dto.price !== undefined && { price: dto.price }),
        }
    });
    return toDto(row);
}

export async function updateSku(productId: string, skuId: string, dto: { sku?: string; attributes?: Record<string, any>; stock?: number; price?: number; isActive?: boolean }): Promise<ProductSkuRow> {
    ensureModelAvailable();
    await getSkuById(productId, skuId);
    // Validate SKU and price on update as well
    const product = await productsService.getProductById(productId);
    if (dto.sku && product.sku && dto.sku === product.sku) {
        throw createError('El SKU de la combinación no puede ser igual al SKU del producto base', 400, ['sku']);
    }
    if (dto.price !== undefined && dto.price !== null) {
        const priceNum = Number(dto.price);
        if (Number.isNaN(priceNum) || priceNum < 0) {
            throw createError('Precio inválido para la combinación', 400, ['price']);
        }
    }
    // Merge attributes/images when updating: if dto.images present, include in attributes
    const dataToUpdate: any = {};
    if (dto.sku !== undefined) dataToUpdate.sku = dto.sku;
    if (dto.stock !== undefined) dataToUpdate.stock = dto.stock;
    if (dto.price !== undefined) dataToUpdate.price = dto.price;
    if (dto.isActive !== undefined) dataToUpdate.isActive = dto.isActive;
    if (dto.attributes !== undefined || (dto as any).images !== undefined) {
        const attrs = { ...(dto.attributes ?? {}) };
        if ((dto as any).images !== undefined && Array.isArray((dto as any).images)) {
            attrs.images = (dto as any).images;
        }
        dataToUpdate.attributes = attrs;
    }
    // @ts-ignore
    const row = await (prisma as any).productSku.update({ where: { id: skuId }, data: dataToUpdate });
    return toDto(row);
}

export async function deleteSku(productId: string, skuId: string): Promise<void> {
    ensureModelAvailable();
    await getSkuById(productId, skuId);
    // @ts-ignore
    await (prisma as any).productSku.delete({ where: { id: skuId } });
}
