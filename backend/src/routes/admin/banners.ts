/**
 * routes/admin/banners.ts
 * Rutas para gestionar banners de la homepage.
 *
 * Prefijo: /api/admin/banners
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/admin/bannersController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../types';

const router = Router();

router.use(authMiddleware);

// ─── CRUD banners ─────────────────────────────────────────────────────────────
router.get('/', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.index);
router.get('/:id', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.show);
router.post('/', requireRole(UserRole.ADMIN), ctrl.create);
router.put('/:id', requireRole(UserRole.ADMIN), ctrl.update);
router.delete('/:id', requireRole(UserRole.ADMIN), ctrl.remove);
router.post('/reorder', requireRole(UserRole.ADMIN), ctrl.reorder);

export default router;
