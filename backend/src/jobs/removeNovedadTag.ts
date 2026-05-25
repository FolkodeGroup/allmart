// src/jobs/removeNovedadTag.ts
import { prisma } from '../config/prisma';

export async function removeExpiredNovedadTags(): Promise<void> {
    const TWO_WEEKS_AGO = new Date();
    TWO_WEEKS_AGO.setDate(TWO_WEEKS_AGO.getDate() - 14);

    const products = await prisma.product.findMany({
        where: {
            novedadSince: { lte: TWO_WEEKS_AGO, not: null },
        },
        select: { id: true, tags: true },
    });

    if (products.length === 0) return;

    console.log(`[removeNovedadTag] Procesando ${products.length} productos...`);

    for (const product of products) {
        const currentTags = Array.isArray(product.tags) ? product.tags as string[] : [];
        await prisma.product.update({
            where: { id: product.id },
            data: {
                tags: currentTags.filter(t => t !== 'novedad'),
                novedadSince: null,
            },
        });
    }

    console.log(`[removeNovedadTag] ${products.length} productos actualizados`);
}