/**
 * routes/admin/reports.ts
 * Rutas del módulo de reportes del panel admin.
 *
 * Prefijo: /api/admin/reports
 */

import { Router } from "express";
import * as ctrl from "../../controllers/admin/reportsController";
import { authMiddleware } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/permissions";
import { UserRole } from "../../types";

const router = Router();

router.use(authMiddleware);

// Todos solo ADMIN
router.get("/summary", requireRole(UserRole.ADMIN), ctrl.summary);
router.get("/sales-by-day", requireRole(UserRole.ADMIN), ctrl.salesByDay);
router.get("/orders-by-status", requireRole(UserRole.ADMIN), ctrl.ordersByStatus);
router.get("/top-products", requireRole(UserRole.ADMIN), ctrl.topProducts);

export default router;