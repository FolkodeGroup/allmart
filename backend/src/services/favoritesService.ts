/**
 * services/favoritesService.ts
 * Servicio para gestión de favoritos de usuario utilizando sessionId.
 */

import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

export interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  status: string;
}

export interface FavoriteItem {
  id: string;
  productId: string;
  createdAt: string;
  product: FavoriteProduct;
}

/**
 * Obtiene los favoritos de un usuario basados en su sessionId.
 */
export async function getUserFavorites(sessionId: string): Promise<FavoriteItem[]> {
  const favorites = await prisma.favorite.findMany({
    where: { sessionId },
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
    // Mapeamos las imágenes relacionales al array de strings esperado por el frontend
    const images = Array.isArray(f.product.productImages)
      ? f.product.productImages.map((img: any) => `/api/images/products/${img.id}`)
      : [];

    return {
      id: f.id,
      productId: f.productId,
      createdAt: f.createdAt.toISOString(),
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
 * Agrega o quita un producto de favoritos usando el sessionId.
 */
export async function toggleFavorite(sessionId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw createError('Producto no encontrado', 404);

  const existing = await prisma.favorite.findUnique({
    where: {
      sessionId_productId: {
        sessionId,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { isFavorite: false };
  }

  await prisma.favorite.create({
    data: { sessionId, productId },
  });
  return { isFavorite: true };
}

/**
 * Verifica si un producto específico es favorito de la sesión actual.
 */
export async function checkFavorite(sessionId: string, productId: string) {
  const fav = await prisma.favorite.findUnique({
    where: {
      sessionId_productId: {
        sessionId,
        productId,
      },
    },
  });
  return { isFavorite: !!fav };
}

/**
 * Elimina un favorito específico.
 */
export async function removeFavorite(sessionId: string, productId: string) {
  const sessionId_productId = { sessionId, productId };
  const existing = await prisma.favorite.findUnique({ where: { sessionId_productId } });
  if (!existing) throw createError('Favorito no encontrado', 404);
  await prisma.favorite.delete({ where: { sessionId_productId } });
}