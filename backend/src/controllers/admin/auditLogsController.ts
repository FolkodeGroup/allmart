/**
 * controllers/admin/auditLogsController.ts
 * Controlador de solo lectura para la auditoría del panel de administración.
 */

import { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

/**
 * GET /api/admin/audit-logs
 * Obtiene la lista de logs de auditoría ordenada cronológicamente (más recientes primero).
 */
export async function getLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const safeLimit = Math.min(Math.max(1, limit), 200);

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    // Formatear para compatibilidad estructural con la interfaz del panel de administración
    const formatted = logs.map(l => ({
      id: l.id,
      timestamp: l.createdAt.toISOString(),
      user: l.userEmail,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      details: l.details
    }));

    sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
}