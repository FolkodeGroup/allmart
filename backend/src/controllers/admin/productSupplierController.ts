/**
 * controllers/admin/productSupplierController.ts
 * REST controller for product ↔ supplier relationships.
 */

import { Response, NextFunction } from 'express';
import { productSupplierService } from '../../services/productSupplierService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function listSuppliers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await productSupplierService.listForProduct(req.params.id);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function assignSupplier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await productSupplierService.assign(req.params.id, {
      ...req.body,
      changedBy: req.user?.userId,
    });
    sendSuccess(res, data, 201, 'Proveedor asignado');
  } catch (err) { next(err); }
}

export async function updatePrice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await productSupplierService.updatePrice(
      req.params.id,
      req.params.supplierId,
      { ...req.body, changedBy: req.user?.userId },
    );
    sendSuccess(res, data, 200, 'Precio actualizado');
  } catch (err) { next(err); }
}

export async function removeSupplier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await productSupplierService.remove(req.params.id, req.params.supplierId);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function setPrimary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await productSupplierService.setPrimary(req.params.id, req.body.supplierId);
    sendSuccess(res, data, 200, 'Proveedor principal actualizado');
  } catch (err) { next(err); }
}

export async function getPriceHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { supplierId, startDate, endDate, limit } = req.query;
    const data = await productSupplierService.getPriceHistory(req.params.id, {
      supplierId: supplierId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, data);
  } catch (err) { next(err); }
}
