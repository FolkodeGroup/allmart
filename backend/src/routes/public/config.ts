/**
 * routes/public/config.ts
 * Rutas de configuración dinámica (públicas, sin autenticación).
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/public/configController';

const router = Router();

router.get('/navigation', ctrl.navigation);     // GET /api/config/navigation
router.get('/sort-options', ctrl.sortOptions);   // GET /api/config/sort-options
router.get('/filters', ctrl.filters);           // GET /api/config/filters

export default router;
