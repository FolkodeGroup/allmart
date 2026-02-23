/**
 * routes/admin/categories.ts
 * Rutas del dominio de categorías.
 *
 * Prefijo: /api/admin/categories
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/admin/categoriesController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../types';

const router = Router();

router.use(authMiddleware);

router.get('/',    requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.index);
router.get('/:id', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.show);
router.post('/',   requireRole(UserRole.ADMIN), ctrl.create);
router.put('/:id', requireRole(UserRole.ADMIN), ctrl.update);
router.delete('/:id', requireRole(UserRole.ADMIN), ctrl.remove);

export default router;
