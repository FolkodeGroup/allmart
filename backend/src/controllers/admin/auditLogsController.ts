import { Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function getLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    // Formatear para que el frontend lo entienda igual que antes
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
  } catch (err) { next(err); }
}

export async function createLog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { timestamp, user, action, entity, entityId, details } = req.body;
    const log = await prisma.auditLog.create({
      data: {
        createdAt: timestamp ? new Date(timestamp) : new Date(),
        userEmail: user || 'desconocido',
        action,
        entity,
        entityId,
        details: details || {}
      }
    });
    sendSuccess(res, log, 201);
  } catch (err) { next(err); }
}

export async function deleteLog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await prisma.auditLog.delete({ where: { id: req.params.id } });
    sendSuccess(res, null);
  } catch (err) { next(err); }
}

export async function clearLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await prisma.auditLog.deleteMany({});
    sendSuccess(res, null);
  } catch (err) { next(err); }
}