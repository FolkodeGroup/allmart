import { Router } from 'express';
import * as ctrl from '../../controllers/public/favoritesController';

const router = Router();

router.get('/', ctrl.index);
router.post('/:productId', ctrl.toggle);
router.get('/:productId/check', ctrl.check);
router.delete('/:productId', ctrl.destroy);

export default router;