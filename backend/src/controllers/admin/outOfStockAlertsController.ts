/**
 * controllers/admin/outOfStockAlertsController.ts
 * Controlador para alertas de pedidos pendientes de productos sin stock
 */

import { Response, NextFunction } from 'express';
import * as outOfStockAlertsService from '../../services/outOfStockAlertsService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const alerts = await outOfStockAlertsService.getOutOfStockAlerts(page, limit);
    sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
}

export async function count(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await outOfStockAlertsService.getOutOfStockAlertCount();
    sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
}

export async function getByProductId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { productId } = req.params;
    const alert = await outOfStockAlertsService.getOutOfStockAlertsByProductId(productId);
    if (!alert) {
      sendSuccess(res, null);
    } else {
      sendSuccess(res, alert);
    }
  } catch (err) {
    next(err);
  }
}
