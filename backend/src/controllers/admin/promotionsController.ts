/**
 * controllers/admin/promotionsController.ts
 * Controlador CRUD para el dominio de promociones.
 */

import { Response, NextFunction } from 'express';
import * as promotionsService from '../../services/promotionsService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreatePromotionDTO, UpdatePromotionDTO } from '../../services/promotionsService';

export async function index(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { q, isActive, page, limit } = req.query;

    const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : 1;
    const limitNum = limit ? Math.max(1, Math.min(100, parseInt(limit as string, 10))) : 10;

    const filters: any = {};
    if (q) filters.search = q as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await promotionsService.getAllPromotions(
      (pageNum - 1) * limitNum,
      limitNum,
      filters
    );

    sendSuccess(res, {
      data: result.data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        pages: Math.ceil(result.total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function show(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const promotion = await promotionsService.getPromotionById(req.params.id);
    sendSuccess(res, promotion);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const promotion = await promotionsService.createPromotion(req.body as CreatePromotionDTO);
    sendSuccess(res, promotion, 201, 'Promoción creada');
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const promotion = await promotionsService.updatePromotion(
      req.params.id,
      req.body as UpdatePromotionDTO
    );
    sendSuccess(res, promotion, 200, 'Promoción actualizada');
  } catch (err) {
    next(err);
  }
}

export async function destroy(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await promotionsService.deletePromotion(req.params.id);
    sendSuccess(res, null, 200, 'Promoción eliminada');
  } catch (err) {
    next(err);
  }
}

export async function duplicate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const promotion = await promotionsService.duplicatePromotion(req.params.id);
    sendSuccess(res, promotion, 201, 'Promoción duplicada');
  } catch (err) {
    next(err);
  }
}
