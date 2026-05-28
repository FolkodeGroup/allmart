/**
 * routes/admin/productSuppliers.ts
 * Routes for product ↔ supplier relationship management.
 * Mounted at /api/admin/products/:id/suppliers
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/admin/productSupplierController';

// Must use mergeParams: true so :id is available from the parent router
const router = Router({ mergeParams: true });

router.get('/', ctrl.listSuppliers);
router.post('/', ctrl.assignSupplier);
router.put('/:supplierId', ctrl.updatePrice);
router.delete('/:supplierId', ctrl.removeSupplier);
router.post('/primary', ctrl.setPrimary);
router.get('/price-history', ctrl.getPriceHistory);

export default router;
