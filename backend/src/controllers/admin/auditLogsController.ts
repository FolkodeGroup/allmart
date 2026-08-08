/**
 * controllers/admin/auditLogsController.ts
 * Controlador para la auditoría del panel de administración.
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
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const safeLimit = Math.min(Math.max(1, limit), 500);

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

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

/**
 * DELETE /api/admin/audit-logs/clear
 * Elimina todos los registros de auditoría de la base de datos.
 */
export async function clearLogs(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.auditLog.deleteMany({});
    sendSuccess(res, null, 200, 'Historial de auditoría vaciado correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/audit-logs/:id
 * Elimina un registro individual de auditoría por ID.
 */
export async function deleteLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.auditLog.delete({ where: { id } });
    sendSuccess(res, { id }, 200, 'Registro de auditoría eliminado');
  } catch (err) {
    next(err);
  }
}