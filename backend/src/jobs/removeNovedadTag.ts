// src/jobs/removeNovedadTag.ts
import { prisma } from '../config/prisma';

export async function removeExpiredNovedadTags(): Promise<void> {
    const TWO_WEEKS_AGO = new Date();
    TWO_WEEKS_AGO.setDate(TWO_WEEKS_AGO.getDate() - 14);

    // Seleccionamos solo el ID, ya no existe "tags" directo en el producto
    const products = await prisma.product.findMany({
        where: {
            novedadSince: { lte: TWO_WEEKS_AGO, not: null },
        },
        select: { id: true },
    });

    if (products.length === 0) return;

    for (const product of products) {
        await prisma.$transaction(async (tx) => {
            // 1. Buscamos el tag "novedad"
            const tag = await tx.tag.findUnique({ where: { name: 'novedad' } });
            
            // 2. Si existe, eliminamos la relación con este producto
            if (tag) {
                await tx.productTag.deleteMany({
                    where: {
                        productId: product.id,
                        tagId: tag.id,
                    },
                });
            }

            // 3. Limpiamos la fecha de novedad
            await tx.product.update({
                where: { id: product.id },
                data: {
                    novedadSince: null,
                },
            });
        });
    }
}