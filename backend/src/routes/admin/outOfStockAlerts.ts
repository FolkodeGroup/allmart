/**
 * routes/admin/outOfStockAlerts.ts
 * Rutas para alertas de productos sin stock con pedidos pendientes
 */

import { Router } from 'express';
import * as outOfStockAlertsController from '../../controllers/admin/outOfStockAlertsController';

const router = Router();

// GET /api/admin/out-of-stock-alerts - Obtener todas las alertas con paginación
router.get('/', outOfStockAlertsController.index);

// GET /api/admin/out-of-stock-alerts/count - Obtener cantidad de alertas
router.get('/count', outOfStockAlertsController.count);

// GET /api/admin/out-of-stock-alerts/product/:productId - Obtener alertas de un producto específico
router.get('/product/:productId', outOfStockAlertsController.getByProductId);

export default router;
