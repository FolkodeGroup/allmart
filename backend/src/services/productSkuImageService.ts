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

/* async function syncSkuImages(_skuId: string, _productId?: string) {
    return;
} */

export async function uploadSkuImage(skuId: string, file: UploadedImageFile, altText?: string, position?: number, isPrimary?: boolean) {
    const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) throw createError(`Tipo de archivo no permitido: ${file.mimetype}`, 400);
    if (file.size > 8 * 1024 * 1024) throw createError('El archivo supera los 8 MB', 400);

    const sku = await prisma.productSku.findUnique({ where: { id: skuId } });
    if (!sku) throw createError('SKU no encontrado', 404);

    if (position === undefined) {
        position = await prisma.productSkuImageStorage.count({ where: { skuId } });
    }

    const timestamp = Date.now();
    const extension = file.mimetype.split('/')[1] || 'webp';
    const s3Key = `skus/${skuId}/${timestamp}-${position}.${extension}`;

    try {
        await r2Client.send(new PutObjectCommand({
            Bucket: env.R2_BUCKET_NAME, Key: s3Key, Body: file.buffer, ContentType: file.mimetype,
        }));
    } catch (error) {
        console.error('[R2] Error SKU upload:', error);
    }

    const created = await prisma.productSkuImageStorage.create({
        data: {
            skuId,
            storageKey: s3Key,
            width: 0, height: 0,
            mimeType: file.mimetype,
            originalFilename: file.originalname,
            sizeBytes: file.size,
            altText: altText ?? null,
            position,
            isPrimary: Boolean(isPrimary ?? false),
        },
    });

    if (created.isPrimary) {
        await prisma.productSkuImageStorage.updateMany({ where: { skuId, id: { not: created.id } }, data: { isPrimary: false } });
    }

    return {
        id: created.id,
        skuId: created.skuId,
        url: `/api/images/sku/${created.id}`,
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
        select: { id: true, skuId: true, altText: true, position: true, isPrimary: true, createdAt: true, updatedAt: true, storageKey: true }
    });
    return rows.map(r => ({ 
        ...r, 
        url: `/api/images/sku/${r.id}`,
        cdnUrl: r.storageKey ? `${env.R2_PUBLIC_URL}/${r.storageKey}` : null
    }));
}

export async function serveSkuImage(id: string) {
    const row = await prisma.productSkuImageStorage.findUnique({ where: { id }, select: { storageKey: true, mimeType: true } });
    if (row?.storageKey && env.R2_PUBLIC_URL) {
        return { data: Buffer.alloc(0), mimeType: row.mimeType, redirectUrl: `${env.R2_PUBLIC_URL}/${row.storageKey}` };
    }
    throw createError('No disponible', 404);
}

export async function serveSkuImageThumb(id: string) {
    const row = await prisma.productSkuImageStorage.findUnique({ where: { id }, select: { storageThumbKey: true, storageKey: true, mimeType: true } });
    const key = row?.storageThumbKey || row?.storageKey;
    if (key && env.R2_PUBLIC_URL) {
        return { data: Buffer.alloc(0), mimeType: row.mimeType, redirectUrl: `${env.R2_PUBLIC_URL}/${key}` };
    }
    throw createError('No disponible', 404);
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
        }
    });
    if (updated.isPrimary) {
        await prisma.productSkuImageStorage.updateMany({ where: { skuId: updated.skuId, id: { not: updated.id } }, data: { isPrimary: false } });
    }
    return { ...updated, url: `/api/images/sku/${updated.id}` };
}

export async function deleteSkuImage(id: string) {
    const existing = await prisma.productSkuImageStorage.findUnique({ where: { id } });
    if (!existing) throw createError('Imagen no encontrada', 404);
    await prisma.productSkuImageStorage.delete({ where: { id } });
}