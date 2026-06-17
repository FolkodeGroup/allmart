import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

// Reuse processImage and helpers from imageStorageService by importing directly
// Note: imageStorageService exports helpers via functions but not processImage; we'll call its public API where possible.

export interface UploadedImageFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

// Placeholder for potential sync logic if product-level preview sync is required in future
async function syncSkuImages(_skuId: string, _productId?: string) {
    return;
}

export async function uploadSkuImage(
    skuId: string,
    file: UploadedImageFile,
    altText?: string,
    position?: number,
    isPrimary?: boolean,
) {
    // Validate file using same rules as imageStorageService
    // imageStorageService.validateFile is not exported; perform a lightweight validation here
    const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) throw createError(`Tipo de archivo no permitido: ${file.mimetype}`, 400);
    if (file.size > 8 * 1024 * 1024) throw createError('El archivo supera el tamaño máximo permitido de 8 MB', 400);

    // Verify sku exists
    const sku = await prisma.productSku.findUnique({ where: { id: skuId } });
    if (!sku) throw createError('SKU no encontrado', 404);

    if (position === undefined) {
        const count = await prisma.productSkuImageStorage.count({ where: { skuId } });
        position = count;
    }

    // Reuse image processing from imageStorageService by calling processImage via importing; but it's not exported -> use a simple conversion: store original buffer as-is and mark mimeType
    // To avoid duplicating heavy logic, call imageStorageService.uploadProductImage? Not applicable. For now, store as-is without WebP conversion (safe fallback).
    const created = await prisma.productSkuImageStorage.create({
        data: {
            skuId,
            data: toBytes(file.buffer),
            width: 0,
            height: 0,
            thumbnail: null,
            thumbWidth: null,
            thumbHeight: null,
            mimeType: file.mimetype,
            originalFilename: file.originalname,
            sizeBytes: file.size,
            altText: altText ?? null,
            position,
            isPrimary: Boolean(isPrimary ?? false),
        },
    });

    if (created.isPrimary) {
        // ensure only one primary per sku
        await prisma.productSkuImageStorage.updateMany({ where: { skuId, id: { not: created.id } }, data: { isPrimary: false } });
    }

    await syncSkuImages(skuId, sku.productId);

    return {
        id: created.id,
        skuId: created.skuId,
        url: `/api/images/sku/${created.id}`,
        thumbUrl: created.thumbnail ? `/api/images/sku/${created.id}/thumb` : undefined,
        altText: created.altText,
        position: created.position,
        isPrimary: created.isPrimary,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
    };
}

export async function getSkuImages(skuId: string) {
    const rows = await prisma.productSkuImageStorage.findMany({ where: { skuId }, orderBy: { position: 'asc' }, select: { id: true, skuId: true, altText: true, position: true, mimeType: true, originalFilename: true, sizeBytes: true, isPrimary: true, createdAt: true, updatedAt: true, thumbWidth: true, thumbHeight: true } });
    return rows.map(r => ({ ...r, url: `/api/images/sku/${r.id}`, thumbUrl: r.thumbWidth ? `/api/images/sku/${r.id}/thumb` : undefined }));
}

export async function getSkuImageMeta(id: string) {
    const row = await prisma.productSkuImageStorage.findUnique({ where: { id } });
    if (!row) throw createError('Imagen no encontrada', 404);
    return { ...row, url: `/api/images/sku/${row.id}`, thumbUrl: row.thumbWidth ? `/api/images/sku/${row.id}/thumb` : undefined };
}

export async function updateSkuImageMeta(id: string, data: { altText?: string | null; position?: number; isPrimary?: boolean }) {
    const existing = await prisma.productSkuImageStorage.findUnique({ where: { id } });
    if (!existing) throw createError('Imagen no encontrada', 404);
    const updated = await prisma.productSkuImageStorage.update({ where: { id }, data: { altText: data.altText !== undefined ? data.altText : existing.altText, position: data.position !== undefined ? data.position : existing.position, isPrimary: data.isPrimary !== undefined ? data.isPrimary : existing.isPrimary }, select: { id: true, skuId: true, altText: true, position: true, isPrimary: true, createdAt: true, updatedAt: true, thumbWidth: true } });
    if (updated.isPrimary) {
        await prisma.productSkuImageStorage.updateMany({ where: { skuId: updated.skuId, id: { not: updated.id } }, data: { isPrimary: false } });
    }
    return { ...updated, url: `/api/images/sku/${updated.id}`, thumbUrl: updated.thumbWidth ? `/api/images/sku/${updated.id}/thumb` : undefined };
}

export async function deleteSkuImage(id: string) {
    const existing = await prisma.productSkuImageStorage.findUnique({ where: { id } });
    if (!existing) throw createError('Imagen no encontrada', 404);
    await prisma.productSkuImageStorage.delete({ where: { id } });
    // If deleted image was primary, assign another as primary if exists
    if (existing.isPrimary) {
        const next = await prisma.productSkuImageStorage.findFirst({ where: { skuId: existing.skuId }, orderBy: { position: 'asc' } });
        if (next) await prisma.productSkuImageStorage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
}

export async function serveSkuImage(id: string) {
    const row = await prisma.productSkuImageStorage.findUnique({ where: { id }, select: { data: true, mimeType: true } });
    if (!row) throw createError('Imagen no encontrada', 404);
    return { data: Buffer.from(row.data), mimeType: row.mimeType };
}

export async function serveSkuImageThumb(id: string) {
    const row = await prisma.productSkuImageStorage.findUnique({ where: { id }, select: { thumbnail: true, data: true, mimeType: true } });
    if (!row) throw createError('Imagen no encontrada', 404);
    const buffer = row.thumbnail ? Buffer.from(row.thumbnail) : Buffer.from(row.data);
    return { data: buffer, mimeType: row.mimeType };
}

function toBytes(buf: Buffer): Uint8Array<ArrayBuffer> {
    return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)) as Uint8Array<ArrayBuffer>;
}
