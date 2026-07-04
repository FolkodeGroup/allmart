import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as reviewsService from '../../services/reviewsService';

export const index = async (req: Request, res: Response) => {
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

export const createGuest = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { orderId, reviewerName, rating, title, text } = req.body;

    if (!orderId || !reviewerName || !rating) {
      res.status(400).json({ message: 'Campos requeridos: orderId, reviewerName, rating' });
      return;
    }

    const review = await reviewsService.createGuestReview({
      productId,
      orderId: String(orderId),
      reviewerName: String(reviewerName),
      rating: Number(rating),
      title,
      text,
    });
    res.status(201).json(review);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};

export const destroy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    await reviewsService.deleteReview(reviewId);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};