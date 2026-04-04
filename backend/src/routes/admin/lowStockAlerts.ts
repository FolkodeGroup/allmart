/**
 * routes/admin/lowStockAlerts.ts
 * Rutas para alertas de stock bajo
 */

import { Router } from 'express';
import * as lowStockAlertsController from '../../controllers/admin/lowStockAlertsController';

const router = Router();

// GET /api/admin/low-stock-alerts - Obtener todas las alertas con paginación
router.get('/', lowStockAlertsController.index);

// GET /api/admin/low-stock-alerts/count - Obtener cantidad de alertas en últimas 24hs
router.get('/count', lowStockAlertsController.count);

// GET /api/admin/low-stock-alerts/current-products - Obtener productos con stock crítico actual
router.get('/current-products', lowStockAlertsController.currentProducts);

// GET /api/admin/low-stock-alerts/product/:productId - Obtener alertas de un producto
router.get('/product/:productId', lowStockAlertsController.getByProductId);

export default router;
