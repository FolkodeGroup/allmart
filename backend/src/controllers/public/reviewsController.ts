/**
 * controllers/public/reviewsController.ts
 * Controlador para reviews de productos (endpoints públicos + autenticados).
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as reviewsService from '../../services/reviewsService';

/** GET /api/products/:productId/reviews */
export const index = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const result = await reviewsService.getProductReviews(productId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};

/** POST /api/products/:productId/reviews (requiere auth) */
export const create = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.userId;
    const { rating, title, text } = req.body;

    const review = await reviewsService.createReview({
      productId,
      userId,
      rating,
      title,
      text,
    });
    res.status(201).json(review);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};

/** DELETE /api/reviews/:reviewId (requiere auth) */
export const destroy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    await reviewsService.deleteReview(reviewId, userId, isAdmin);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};
