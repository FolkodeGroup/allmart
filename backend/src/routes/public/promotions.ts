/**
 * routes/public/promotions.ts
 * Rutas públicas para obtener promociones y descuentos.
 */

import { Router } from 'express';
import * as controller from '../../controllers/public/promotionsController';

const router = Router();

// GET /api/promotions/active - Obtener todas las promociones activas
router.get('/active', controller.getActivePromotions);

// GET /api/promotions/discounts/active - Obtener descuentos activos
router.get('/discounts/active', controller.getActiveDiscounts);

// GET /api/promotions/product-discount/:productId - Obtener descuento de un producto específico
router.get('/product-discount/:productId', controller.getProductDiscount);

export default router;
