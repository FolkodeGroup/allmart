/**
 * routes/public/banners.ts
 * Rutas públicas para obtener banners activos.
 *
 * Prefijo: /api/banners
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/public/bannersController';

const router = Router();

// ─── Rutas públicas ───────────────────────────────────────────────────────────
router.get('/', ctrl.getActiveBanners);

export default router;
