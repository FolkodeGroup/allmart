/**
 * routes/admin/products/images.ts
 * Rutas de imágenes de producto (subdominio de products).
 *
 * Prefijo: /api/admin/products/:productId/images
 */

import { Router } from 'express';
import * as ctrl from '../../../controllers/admin/productImagesController';
import { authMiddleware } from '../../../middlewares/auth';
import { requireRole } from '../../../middlewares/permissions';
import { UserRole } from '../../../types';

const router = Router({ mergeParams: true }); // mergeParams para acceder a :productId

router.use(authMiddleware);

router.get('/',    requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.index);
router.get('/:id', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.show);
router.post('/',   requireRole(UserRole.ADMIN), ctrl.create);
router.put('/:id', requireRole(UserRole.ADMIN), ctrl.update);
router.delete('/:id', requireRole(UserRole.ADMIN), ctrl.remove);

export default router;
