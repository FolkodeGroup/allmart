/**
 * routes/public/favorites.ts
 * Rutas de favoritos de usuario (todas requieren autenticación).
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/public/favoritesController';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

// GET    /api/favorites                 (lista mis favoritos)
router.get('/', authMiddleware, ctrl.index);

// POST   /api/favorites/:productId      (toggle favorito)
router.post('/:productId', authMiddleware, ctrl.toggle);

// GET    /api/favorites/:productId/check (verificar si es favorito)
router.get('/:productId/check', authMiddleware, ctrl.check);

// DELETE /api/favorites/:productId      (eliminar favorito)
router.delete('/:productId', authMiddleware, ctrl.destroy);

export default router;
