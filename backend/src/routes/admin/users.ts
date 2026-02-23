/**
 * routes/admin/users.ts
 * Rutas del módulo de usuarios (solo admins).
 *
 * Prefijo: /api/admin/users
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/admin/usersController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../types';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(UserRole.ADMIN)); // Sólo admin puede gestionar usuarios

router.get('/',    ctrl.index);
router.get('/:id', ctrl.show);
router.post('/',   ctrl.create);
router.delete('/:id', ctrl.remove);

export default router;
