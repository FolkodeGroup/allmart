/**
 * routes/admin/auditLogs.ts
 * Rutas de auditoría del panel de administración.
 *
 * Prefijo: /api/admin/audit-logs
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/admin/auditLogsController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole, AuthenticatedRequest } from '../../types';
import * as auditService from '../../services/auditService';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(UserRole.ADMIN, UserRole.EDITOR));

// GET /api/admin/audit-logs
router.get('/', ctrl.getLogs);

// DELETE /api/admin/audit-logs/clear
router.delete('/clear', ctrl.clearLogs);

// DELETE /api/admin/audit-logs/:id
router.delete('/:id', ctrl.deleteLog);

// POST /api/admin/audit-logs
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { action, entity, entityId, details } = req.body;
    
    await auditService.recordAction({
      userEmail: req.user?.user || 'desconocido_frontend',
      action: action || 'accion_cliente',
      entity: entity || 'general',
      entityId: entityId || null,
      details: details || {},
    });

    return sendSuccess(res, { message: 'Log de auditoría registrado correctamente' }, 201);
  } catch (err) {
    console.error('[Audit][POST-Error] No se pudo guardar el log del cliente:', err);
    return sendSuccess(res, { message: 'Procesado con advertencias' }, 200);
  }
});

export default router;