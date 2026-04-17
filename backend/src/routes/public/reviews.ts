/**
 * routes/public/reviews.ts
 * Rutas de reviews de productos.
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/public/reviewsController';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

// GET  /api/products/:productId/reviews  (público)
router.get('/products/:productId/reviews', ctrl.index);

// POST /api/products/:productId/reviews  (requiere auth)
router.post('/products/:productId/reviews', authMiddleware, ctrl.create);

// DELETE /api/reviews/:reviewId           (requiere auth)
router.delete('/reviews/:reviewId', authMiddleware, ctrl.destroy);

export default router;
