import { Router } from 'express';
import * as ctrl from '../../controllers/public/reviewsController';
import { adminMiddleware } from '../../middlewares/auth';

const router = Router();

router.get('/products/:productId/reviews', ctrl.index);
router.post('/products/:productId/reviews/guest', ctrl.createGuest);
// Requiere admin para eliminar
router.delete('/reviews/:reviewId', adminMiddleware, ctrl.destroy);

export default router;