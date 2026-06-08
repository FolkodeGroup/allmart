/**
 * routes/admin/products/variants.ts
 * Rutas de variantes de producto (subdominio de products).
 *
 * Prefijo: /api/admin/products/:productId/variants
 */

import { Router } from 'express';
import * as ctrl from '../../../controllers/admin/productVariantsController';
import { authMiddleware } from '../../../middlewares/auth';
import { requireRole } from '../../../middlewares/permissions';
import { UserRole } from '../../../types';
import childrenRouter from './variants/children';

const router = Router({ mergeParams: true }); // mergeParams para acceder a :productId

router.use(authMiddleware);

router.get('/', requireRole(UserRole.ADMIN), ctrl.index);
router.post('/', requireRole(UserRole.ADMIN), ctrl.create);

// Sub-router for SKU / combination children (e.g. /api/admin/products/:productId/variants/children)
// Mount this before the parameterized routes so the literal 'children' path isn't
// captured by the ':variantId' route which would treat it as a UUID.
router.use('/children', childrenRouter);

router.get('/:variantId', requireRole(UserRole.ADMIN), ctrl.show);
router.put('/:variantId', requireRole(UserRole.ADMIN), ctrl.update);
// Edición masiva
router.patch('/bulk', requireRole(UserRole.ADMIN), ctrl.bulkUpdate);
router.delete('/:variantId', requireRole(UserRole.ADMIN), ctrl.remove);

export default router;
