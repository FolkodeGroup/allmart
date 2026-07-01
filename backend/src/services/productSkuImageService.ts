import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../config/r2';
import { env } from '../config/env';
import sharp from 'sharp';

export interface UploadedImageFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

interface ProcessedSkuImage {
    data: Buffer;
    width: number;
    height: number;
    thumbnail: Buffer;
    thumbWidth: number;
    thumbHeight: number;
    sizeBytes: number;
    originalFilename: string;
}

const MAX_WIDTH = 1200;
const THUMBNAIL_WIDTH = 240;
const WEBP_QUALITY = 82;

/**
 * Procesa la imagen de variante: corrige orientación, comprime a WebP
 * y genera una miniatura liviana para optimizar ancho de banda.
 */
async function processSkuImage(buffer: Buffer, originalname: string): Promise<ProcessedSkuImage> {
    const base = sharp(buffer).rotate();
    
    // Procesar imagen principal optimizada
    const fullBufferRaw = await base
        .clone()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    
    const fullMeta = await sharp(fullBufferRaw).metadata();
    
    // Generar miniatura optimizada
    const thumbBufferRaw = await base
        .clone()
        .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();
    
    const thumbMeta = await sharp(thumbBufferRaw).metadata();

    return {
        data: fullBufferRaw,
        width: fullMeta.width ?? 0,
        height: fullMeta.height ?? 0,
        thumbnail: thumbBufferRaw,
        thumbWidth: thumbMeta.width ?? 0,
        thumbHeight: thumbMeta.height ?? 0,
        sizeBytes: fullBufferRaw.length,
        originalFilename: originalname,
    };
}

export async function uploadSkuImage(
    skuId: string, 
    file: UploadedImageFile, 
    altText?: string, 
    position?: number, 
    isPrimary?: boolean
) {
    const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff']);
    if (!allowed.has(file.mimetype)) {
        throw createError(`Tipo de archivo no permitido: ${file.mimetype}`, 400);
    }
    if (file.size > 8 * 1024 * 1024) {
        throw createError('El archivo supera el tamaño máximo de 8 MB', 400);
    }

    const sku = await prisma.productSku.findUnique({ where: { id: skuId } });
    if (!sku) throw createError('SKU no encontrado', 404);

    if (position === undefined) {
        position = await prisma.productSkuImageStorage.count({ where: { skuId } });
    }

    // Procesar y optimizar la imagen con Sharp antes de la transferencia a R2
    const processed = await processSkuImage(file.buffer, file.originalname);
    const timestamp = Date.now();
    const s3KeyFull = `skus/${skuId}/${timestamp}-${position}.webp`;
    const s3KeyThumb = `skus/${skuId}/thumbs/${timestamp}-${position}.webp`;

    try {
        await Promise.all([
            r2Client.send(new PutObjectCommand({
                Bucket: env.R2_BUCKET_NAME, 
                Key: s3KeyFull, 
                Body: processed.data, 
                ContentType: 'image/webp'
            })),
            r2Client.send(new PutObjectCommand({
                Bucket: env.R2_BUCKET_NAME, 
                Key: s3KeyThumb, 
                Body: processed.thumbnail, 
                ContentType: 'image/webp'
            }))
        ]);
    } catch (error) {
        console.error('[R2] Error en la transferencia de imagen de SKU a R2:', error);
        throw createError('No se pudo subir la imagen del SKU a la nube', 500);
    }

    const created = await prisma.productSkuImageStorage.create({
        data: {
            skuId,
            storageKey: s3KeyFull,
            storageThumbKey: s3KeyThumb,
            width: processed.width,
            height: processed.height,
            thumbWidth: processed.thumbWidth,
            thumbHeight: processed.thumbHeight,
            mimeType: 'image/webp',
            originalFilename: processed.originalFilename,
            sizeBytes: processed.sizeBytes,
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

    return {
        id: created.id,
        skuId: created.skuId,
        url: `/api/images/sku/${created.id}`,
        thumbUrl: `/api/images/sku/${created.id}/thumb`,
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
        select: { id: true, skuId: true, altText: true, position: true, isPrimary: true, createdAt: true, updatedAt: true, storageKey: true, storageThumbKey: true }
    });
    return rows.map(r => ({ 
        ...r, 
        url: `/api/images/sku/${r.id}`,
        thumbUrl: `/api/images/sku/${r.id}/thumb`,
        cdnUrl: r.storageKey ? `${env.R2_PUBLIC_URL}/${r.storageKey}` : null,
        cdnThumbUrl: r.storageThumbKey ? `${env.R2_PUBLIC_URL}/${r.storageThumbKey}` : null
    }));
}

export async function getSkuImageMeta(id: string) {
    const row = await prisma.productSkuImageStorage.findUnique({ where: { id } });
    if (!row) throw createError('Imagen de SKU no encontrada', 404);
    return {
        id: row.id,
        skuId: row.skuId,
        url: `/api/images/sku/${row.id}`,
        thumbUrl: `/api/images/sku/${row.id}/thumb`,
        altText: row.altText,
        position: row.position,
        isPrimary: row.isPrimary,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
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
    return { 
        ...updated, 
        url: `/api/images/sku/${updated.id}`,
        thumbUrl: `/api/images/sku/${updated.id}/thumb`
    };
}

export async function deleteSkuImage(id: string) {
    const existing = await prisma.productSkuImageStorage.findUnique({ where: { id } });
    if (!existing) throw createError('Imagen no encontrada', 404);
    await prisma.productSkuImageStorage.delete({ where: { id } });
}