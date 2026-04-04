/**
 * routes/public/collections.ts
 * Rutas públicas para obtener colecciones.
 */

import { Router } from 'express';
import * as controller from '../../controllers/public/collectionsController';

const router = Router();

// GET /api/collections - Obtener colecciones para página home
router.get('/', controller.getHomeCollections);

// GET /api/collections/position/:position - Obtener colecciones por posición de display
router.get('/position/:position', controller.getCollectionsByPosition);

// GET /api/collections/:slug - Obtener colección específica por slug
router.get('/:slug', controller.getCollection);

export default router;
