/**
 * routes/admin/products.ts
 * Rutas principales del dominio de productos.
 * Monta subdominios: /variants y /images.
 *
 * Prefijo: /api/admin/products
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/admin/productsController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../types';
import variantsRouter from './products/variants';
import imagesRouter from './products/images';

const router = Router();

router.use(authMiddleware);

// ─── Subdominios ──────────────────────────────────────────────────────────────
router.use('/:productId/variants', variantsRouter);
router.use('/:productId/images',   imagesRouter);

// ─── CRUD productos ───────────────────────────────────────────────────────────
router.get('/',    requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.index);
router.get('/:id', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.show);
router.post('/',   requireRole(UserRole.ADMIN), ctrl.create);
router.put('/:id', requireRole(UserRole.ADMIN), ctrl.update);
router.delete('/:id', requireRole(UserRole.ADMIN), ctrl.remove);

export default router;
