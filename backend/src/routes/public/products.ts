// routes/public/products.ts

import { Router } from 'express';
import * as ctrl from '../../controllers/public/productsController';

const router = Router();

router.get('/', ctrl.index);       // GET /api/products
router.get('/:slug', ctrl.show);   // GET /api/products/:slug

export default router;