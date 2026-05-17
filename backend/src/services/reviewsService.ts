/**
 * services/reviewsService.ts
 * Servicio para gestión de reviews de productos.
 */

import { prisma } from '../config/prisma';
import { createError } from '../middlewares/errorHandler';

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  text?: string;
}

export interface CreateGuestReviewInput {
  productId: string;
  orderId: string;
  reviewerName: string;
  rating: number;
  title?: string;
  text?: string;
}

/**
 * Obtiene las reviews de un producto con paginación.
 */
export async function getProductReviews(
  productId: string,
  page = 1,
  limit = 10,
) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.productReview.count({ where: { productId } }),
  ]);

  return {
    data: reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId ?? null,
      userName: r.user
        ? `${r.user.firstName} ${r.user.lastName.charAt(0)}.`
        : (r.reviewerName ?? 'Comprador verificado'),
      rating: r.rating,
      title: r.title,
      text: r.text,
      helpful: r.helpful,
      verified: r.orderId !== null,
      createdAt: r.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Crea una review de producto. Un usuario solo puede dejar una review por producto.
 */
export async function createReview(input: CreateReviewInput) {
  if (input.rating < 1 || input.rating > 5) {
    throw createError('El rating debe estar entre 1 y 5', 400);
  }

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw createError('Producto no encontrado', 404);

  const existing = await prisma.productReview.findUnique({
    where: {
      productId_userId: {
        productId: input.productId,
        userId: input.userId,
      },
    },
  });
  if (existing) throw createError('Ya dejaste una review para este producto', 409);

  const review = await prisma.productReview.create({
    data: {
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      title: input.title,
      text: input.text,
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Actualizar rating promedio y count en el producto
  await recalculateProductRating(input.productId);

  return {
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    userName: review.user
        ? `${review.user.firstName} ${review.user.lastName.charAt(0)}.`
        : 'Usuario',
    rating: review.rating,
    title: review.title,
    text: review.text,
    helpful: review.helpful,
    createdAt: review.createdAt,
  };
}

/**
 * Crea una review de producto verificada por número de pedido.
 * No requiere cuenta de usuario; el pedido actúa como prueba de compra.
 */
export async function createGuestReview(input: CreateGuestReviewInput) {
  if (input.rating < 1 || input.rating > 5) {
    throw createError('El rating debe estar entre 1 y 5', 400);
  }
  if (!input.reviewerName?.trim()) {
    throw createError('El nombre del reseñador es requerido', 400);
  }

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw createError('Producto no encontrado', 404);

  // Verificar que el pedido existe y contiene el producto
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { orderItems: { select: { productId: true } } },
  });
  if (!order) throw createError('Pedido no encontrado. Verificá el número de pedido.', 404);

  const hasProduct = order.orderItems.some((item) => item.productId === input.productId);
  if (!hasProduct) {
    throw createError('Este pedido no incluye el producto que querés reseñar.', 400);
  }

  // Una sola reseña por pedido+producto
  const existing = await prisma.productReview.findUnique({
    where: {
      productId_orderId: {
        productId: input.productId,
        orderId: input.orderId,
      },
    },
  });
  if (existing) throw createError('Ya enviaste una reseña para este producto con este pedido.', 409);

  const review = await prisma.productReview.create({
    data: {
      productId: input.productId,
      orderId: input.orderId,
      reviewerName: input.reviewerName.trim(),
      rating: input.rating,
      title: input.title?.trim() || null,
      text: input.text?.trim() || null,
    },
  });

  await recalculateProductRating(input.productId);

  return {
    id: review.id,
    productId: review.productId,
    userName: input.reviewerName.trim(),
    rating: review.rating,
    title: review.title,
    text: review.text,
    helpful: review.helpful,
    verified: true,
    createdAt: review.createdAt,
  };
}

/**
 * Elimina una review. El usuario solo puede borrar su propia review,
 * o un admin puede borrar cualquiera.
 */
export async function deleteReview(reviewId: string, userId: string, isAdmin: boolean) {
  const review = await prisma.productReview.findUnique({ where: { id: reviewId } });
  if (!review) throw createError('Review no encontrada', 404);

  if (!isAdmin && review.userId !== userId) {
    throw createError('No tenés permiso para eliminar esta review', 403);
  }

  await prisma.productReview.delete({ where: { id: reviewId } });
  await recalculateProductRating(review.productId);
}

/**
 * Recalcula el rating promedio y el count de reviews de un producto.
 */
async function recalculateProductRating(productId: string) {
  const aggregation = await prisma.productReview.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: aggregation._avg.rating ?? 0,
      reviewCount: aggregation._count.rating,
    },
  });
}

/**
 * Lista todas las reviews (para admin).
 */
export async function getAllReviews(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.productReview.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.productReview.count(),
  ]);

  return {
    data: reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
