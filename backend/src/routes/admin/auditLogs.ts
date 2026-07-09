/**
 * routes/admin/auditLogs.ts
 * Rutas de auditoría del panel de administración.
 * Soporta consultas de lectura (GET) e inserciones seguras del cliente (POST).
 *
 * Prefijo: /api/admin/audit-logs
 */

import { Router } from 'express';
import * as ctrl from '../../controllers/admin/auditLogsController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../types';
import * as auditService from '../../services/auditService';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.use(authMiddleware);
// Únicamente administradores y editores autorizados pueden consultar y registrar logs
router.use(requireRole(UserRole.ADMIN, UserRole.EDITOR));

// GET /api/admin/audit-logs — Consulta de logs en el panel de administración
router.get('/', ctrl.getLogs);

// 🟢 NUEVO: POST /api/admin/audit-logs — Recibe y registra logs de auditoría enviados desde el cliente
router.post('/', async (req, res) => {
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
    // Si falla el log por base de datos, respondemos con 200 OK para no congelar la UI del frontend
    console.error('[Audit][POST-Error] No se pudo guardar el log del cliente:', err);
    return sendSuccess(res, { message: 'Procesado con advertencias' }, 200);
  }
});

export default router;