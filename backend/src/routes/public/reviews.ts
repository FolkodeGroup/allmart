import { Router, Request, Response, NextFunction } from 'express';
import * as reviewsService from '../../services/reviewsService';
import { sendSuccess } from '../../utils/response';

const router = Router();

// GET /api/reviews/verify-token?token=...
router.get('/reviews/verify-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ success: false, message: 'El token de reseña es requerido' });
      return;
    }
    const tokenInfo = await reviewsService.verifyTokenInfo(token);
    sendSuccess(res, tokenInfo, 200, 'Token de reseña válido');
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews/token
router.post('/reviews/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, rating, title, text } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'El token de reseña es requerido' });
      return;
    }
    if (!rating) {
      res.status(400).json({ success: false, message: 'La calificación en estrellas es requerida' });
      return;
    }
    const review = await reviewsService.createReviewWithToken({
      token,
      rating: Number(rating),
      title,
      text,
    });
    sendSuccess(res, review, 201, '¡Gracias! Tu reseña ha sido publicada exitosamente');
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:productId/reviews
router.get('/products/:productId/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const reviews = await reviewsService.getProductReviews(productId, page, limit);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:productId/reviews/guest (Compatibilidad)
router.post('/products/:productId/reviews/guest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { orderId, reviewerName, rating, title, text } = req.body;
    const review = await reviewsService.createGuestReview({
      productId,
      orderId,
      reviewerName,
      rating: Number(rating),
      title,
      text,
    });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

export default router;