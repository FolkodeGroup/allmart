/**
 * routes/admin/orders.ts
 * Rutas del dominio de pedidos.
 *
 * Prefijo: /api/admin/orders
 */

import { Router } from "express";
import * as ctrl from "../../controllers/admin/ordersController";
import { authMiddleware } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/permissions";
import { UserRole } from "../../types";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.index);
router.get("/:id", requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.show);
router.post("/", requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.create);
router.put("/:id", requireRole(UserRole.ADMIN), ctrl.update);
router.delete("/:id", requireRole(UserRole.ADMIN), ctrl.remove);

router.patch("/:id/status",requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.updateStatus);

export default router;
