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
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          rating: true,
          reviewCount: true,
          inStock: true,
          status: true,
        },
      },
    },
  });

  return favorites.map((f) => ({
    id: f.id,
    productId: f.productId,
    createdAt: f.createdAt,
    product: f.product,
  }));
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
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (!existing) throw createError('Favorito no encontrado', 404);

  await prisma.favorite.delete({ where: { id: existing.id } });
}
