import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../config/r2';
import { env } from '../config/env';

export interface UploadedImageFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

// Placeholder para potencial lógica de sincronización si se requiere en el futuro
async function syncSkuImages(_skuId: string, _productId?: string) {
    return;
}

/**
 * Sube y persiste una imagen de SKU (R2 + DB).
 */
export async function uploadSkuImage(
    skuId: string,
    file: UploadedImageFile,
    altText?: string,
    position?: number,
    isPrimary?: boolean,
) {
    const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) throw createError(`Tipo de archivo no permitido: ${file.mimetype}`, 400);
    if (file.size > 8 * 1024 * 1024) throw createError('El archivo supera el tamaño máximo permitido de 8 MB', 400);

    const sku = await prisma.productSku.findUnique({ where: { id: skuId } });
    if (!sku) throw createError('SKU no encontrado', 404);

    if (position === undefined) {
        const count = await prisma.productSkuImageStorage.count({ where: { skuId } });
        position = count;
    }

    const timestamp = Date.now();
    const extension = file.mimetype.split('/')[1] || 'webp';
    const s3Key = `skus/${skuId}/${timestamp}-${position}.${extension}`;

    // Doble escritura a Cloudflare R2
    try {
        await r2Client.send(new PutObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        console.log(`[R2] Imagen de Variant Image guardada en R2: ${s3Key}`);
    } catch (error) {
        console.error('[R2] Error en doble escritura de SKU a Cloudflare R2:', error);
    }

    const created = await prisma.productSkuImageStorage.create({
        data: {
            skuId,
            storageKey: s3Key,
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
        await prisma.productSkuImageStorage.updateMany({ 
            where: { skuId, id: { not: created.id } }, 
            data: { isPrimary: false } 
        });
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
    const rows = await prisma.productSkuImageStorage.findMany({ 
        where: { skuId }, 
        orderBy: { position: 'asc' }, 
        select: { 
            id: true, skuId: true, altText: true, position: true, 
            mimeType: true, originalFilename: true, sizeBytes: true, 
            isPrimary: true, createdAt: true, updatedAt: true, 
            thumbWidth: true, thumbHeight: true, storageKey: true 
        } 
    });
    return rows.map(r => ({ 
        ...r, 
        url: `/api/images/sku/${r.id}`, 
        thumbUrl: r.thumbWidth ? `/api/images/sku/${r.id}/thumb` : undefined,
        cdnUrl: r.storageKey ? `${env.R2_PUBLIC_URL}/${r.storageKey}` : null
    }));
}

export async function getSkuImageMeta(id: string) {
    const row = await prisma.productSkuImageStorage.findUnique({ where: { id } });
    if (!row) throw createError('Imagen no encontrada', 404);
    return { 
        ...row, 
        url: `/api/images/sku/${row.id}`, 
        thumbUrl: row.thumbWidth ? `/api/images/sku/${row.id}/thumb` : undefined 
    };
}

export async function updateSkuImageMeta(id: string, data: { altText?: string | null; position?: number; isPrimary?: boolean }) {
    const existing = await prisma.productSkuImageStorage.findUnique({ where: { id } });
    if (!existing) throw createError('Imagen no encontrada', 404);
    
    const updated = await prisma.productSkuImageStorage.update({ 
        where: { id }, 
        data: { 
            altText: data.altText !== undefined ? data.altText : existing.altText, 
            position: data.position !== undefined ? data.position : existing.position, 
            isPrimary: data.isPrimary !== undefined ? data.isPrimary : existing.isPrimary 
        }, 
        select: { id: true, skuId: true, altText: true, position: true, isPrimary: true, createdAt: true, updatedAt: true, thumbWidth: true } 
    });

    if (updated.isPrimary) {
        await prisma.productSkuImageStorage.updateMany({ 
            where: { skuId: updated.skuId, id: { not: updated.id } }, 
            data: { isPrimary: false } 
        });
    }
    return { 
        ...updated, 
        url: `/api/images/sku/${updated.id}`, 
        thumbUrl: updated.thumbWidth ? `/api/images/sku/${updated.id}/thumb` : undefined 
    };
}

export async function deleteSkuImage(id: string) {
    const existing = await prisma.productSkuImageStorage.findUnique({ where: { id } });
    if (!existing) throw createError('Imagen no encontrada', 404);
    
    await prisma.productSkuImageStorage.delete({ where: { id } });
    
    if (existing.isPrimary) {
        const next = await prisma.productSkuImageStorage.findFirst({ 
            where: { skuId: existing.skuId }, 
            orderBy: { position: 'asc' } 
        });
        if (next) await prisma.productSkuImageStorage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
}

export async function serveSkuImage(id: string) {
    const row = await prisma.productSkuImageStorage.findUnique({ where: { id }, select: { data: true, mimeType: true } });
    if (!row) throw createError('Imagen no encontrada', 404);
    return { data: row.data ? Buffer.from(row.data) : Buffer.alloc(0), mimeType: row.mimeType };
}

export async function serveSkuImageThumb(id: string) {
    const row = await prisma.productSkuImageStorage.findUnique({ where: { id }, select: { thumbnail: true, data: true, mimeType: true } });
    if (!row) throw createError('Imagen no encontrada', 404);
    const buffer = row.thumbnail ? Buffer.from(row.thumbnail) : (row.data ? Buffer.from(row.data) : Buffer.alloc(0));
    return { data: buffer, mimeType: row.mimeType };
}

function toBytes(buf: Buffer): Uint8Array<ArrayBuffer> {
    return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)) as Uint8Array<ArrayBuffer>;
}