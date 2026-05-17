/**
 * services/reviewsService.ts
 * Servicio frontend para reviews de productos.
 */

import { apiFetch } from '../utils/apiClient';

export interface Review {
  id: string;
  productId: string;
  userId?: string | null;
  userName: string;
  rating: number;
  title: string | null;
  text: string | null;
  helpful: number;
  /** true cuando la reseña fue verificada por un número de pedido */
  verified?: boolean;
  createdAt: string;
}

export interface ReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateReviewPayload {
  rating: number;
  title?: string;
  text?: string;
}

/** Payload para reseña pública verificada por pedido (sin cuenta) */
export interface CreateGuestReviewPayload {
  orderId: string;
  reviewerName: string;
  rating: number;
  title?: string;
  text?: string;
}

export const reviewsService = {
  /** Obtiene las reviews de un producto (público) */
  async getProductReviews(productId: string, page = 1, limit = 10): Promise<ReviewsResponse> {
    return apiFetch<ReviewsResponse>(`/api/products/${productId}/reviews?page=${page}&limit=${limit}`);
  },

  /**
   * Crea una reseña verificada por número de pedido.
   * No requiere autenticación — el pedido actúa como prueba de compra.
   */
  async createGuestReview(productId: string, payload: CreateGuestReviewPayload): Promise<Review> {
    return apiFetch<Review>(`/api/products/${productId}/reviews/guest`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Crea una review (requiere auth) */
  async createReview(productId: string, payload: CreateReviewPayload): Promise<Review> {
    return apiFetch<Review>(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Elimina una review (requiere auth) */
  async deleteReview(reviewId: string): Promise<void> {
    await apiFetch<void>(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};
