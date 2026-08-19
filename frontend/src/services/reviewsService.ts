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

export interface CreateGuestReviewPayload {
  orderId: string;
  reviewerName: string;
  rating: number;
  title?: string;
  text?: string;
}

export interface VerifiedTokenInfo {
  isValid: boolean;
  orderId: string;
  productId: string;
  productName: string;
  productSlug: string;
  customerName: string;
  customerEmail: string;
  alreadyReviewed: boolean;
}

export const reviewsService = {
  /** Obtiene las reviews de un producto (público) */
  async getProductReviews(productId: string, page = 1, limit = 10): Promise<ReviewsResponse> {
    return apiFetch<ReviewsResponse>(`/api/products/${productId}/reviews?page=${page}&limit=${limit}`);
  },

  /** Verifica si el token del correo de invitación es válido */
  async verifyReviewToken(token: string): Promise<VerifiedTokenInfo> {
    const res = await apiFetch<{ success: boolean; data: VerifiedTokenInfo }>(
      `/api/reviews/verify-token?token=${encodeURIComponent(token)}`
    );
    return res.data;
  },

  /** Envía la reseña directamente mediante el token del correo */
  async createTokenReview(token: string, payload: { rating: number; title?: string; text?: string }): Promise<Review> {
    const res = await apiFetch<{ success: boolean; data: Review }>(`/api/reviews/token`, {
      method: 'POST',
      body: JSON.stringify({
        token,
        rating: payload.rating,
        title: payload.title,
        text: payload.text,
      }),
    });
    return res.data;
  },

  /** Crea una reseña verificada manualmente por número de pedido (fallback) */
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