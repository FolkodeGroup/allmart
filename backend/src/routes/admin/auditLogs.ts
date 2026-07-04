/**
 * routes/admin/auditLogs.ts
 * Rutas de auditoría del panel de administración.
 * Restringido estrictamente a operaciones de lectura (Append-Only).
 *
 * Prefijo: /api/admin/audit-logs
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/admin/auditLogsController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../types';

const router = Router();

router.use(authMiddleware);
// Únicamente administradores y editores autorizados pueden consultar los registros de auditoría
router.use(requireRole(UserRole.ADMIN, UserRole.EDITOR));

// Ruta única de consulta (Garantía Append-Only en base de datos)
router.get('/', ctrl.getLogs);

export default router;