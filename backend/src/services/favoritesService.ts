/**
 * services/favoritesService.ts
 * Servicio para gestión de favoritos de usuario.
 */

import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

/**
 * Obtiene los favoritos de un usuario.
 */
export async function getUserFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        include: {
          productImages: {
            select: { id: true },
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  });

  return favorites.map((f) => {
    // 🟢 Mapeamos las imágenes relacionales al array de strings esperado por el frontend
    const images = Array.isArray(f.product.productImages)
      ? f.product.productImages.map((img: any) => `/api/images/products/${img.id}`)
      : [];

    return {
      id: f.id,
      productId: f.productId,
      createdAt: f.createdAt,
      product: {
        id: f.product.id,
        name: f.product.name,
        slug: f.product.slug,
        price: Number(f.product.price),
        images,
        rating: Number(f.product.rating),
        reviewCount: f.product.reviewCount,
        inStock: f.product.inStock,
        status: f.product.status,
      },
    };
  });
}

/**
 * Toggle favorito: si existe lo elimina, si no existe lo crea.
 * Retorna el estado actual (isFavorite).
 */
export async function toggleFavorite(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw createError('Producto no encontrado', 404);

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { isFavorite: false };
  }

  await prisma.favorite.create({
    data: { userId, productId },
  });
  return { isFavorite: true };
}

/**
 * Verifica si un producto es favorito de un usuario.
 */
export async function checkFavorite(userId: string, productId: string) {
  const fav = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });
  return { isFavorite: !!fav };
}

/**
 * Elimina un favorito específico.
 */
export async function removeFavorite(userId: string, productId: string) {
  const userId_productId = { userId, productId };
  const existing = await prisma.favorite.findUnique({ where: { userId_productId } });
  if (!existing) throw createError('Imagen no encontrada', 404);
  await prisma.favorite.delete({ where: { userId_productId } });
}