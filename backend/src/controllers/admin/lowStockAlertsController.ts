/**
 * controllers/admin/lowStockAlertsController.ts
 * Controlador para alertas de stock bajo
 */

import { Response, NextFunction } from 'express';
import * as lowStockAlertsService from '../../services/lowStockAlertsService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const alerts = await lowStockAlertsService.getLowStockAlerts(page, limit);
    sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
}

export async function count(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await lowStockAlertsService.getLowStockAlertCount();
    sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
}

export async function getByProductId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { productId } = req.params;
    const alerts = await lowStockAlertsService.getLowStockAlertsByProductId(productId);
    sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
}
