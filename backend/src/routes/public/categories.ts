/**
 * routes/public/categories.ts
 * Rutas públicas de lectura para categorías.
 *
 * Prefijo montado en: /api/categories
 * Sin middleware de autenticación — acceso libre para el frontend.
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/public/categoriesController';

const router = Router();

// GET /api/categories
router.get('/', ctrl.index);

// GET /api/categories/:slug
router.get('/:slug', ctrl.showBySlug);

export default router;
