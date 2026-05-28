/**
 * routes/admin/suppliersV2.ts
 * RESTful routes for the enhanced Supplier domain (with price history).
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/admin/supplierController';

const router = Router();

// Collection
router.get('/', ctrl.index);
router.post('/', ctrl.create);

// Single supplier
router.get('/:id', ctrl.show);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// Sub-resources
router.get('/:id/products', ctrl.getProducts);
router.get('/:id/price-history', ctrl.getPriceHistory);

export default router;
