/**
 * controllers/admin/supplierController.ts
 * REST controller for the Supplier domain.
 */

import { Response, NextFunction } from 'express';
import { supplierService } from '../../services/supplierService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { q, isActive, page, limit } = req.query;
    const result = await supplierService.list({
      q: q as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.getById(req.params.id);
    sendSuccess(res, supplier);
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.create(req.body);
    sendSuccess(res, supplier, 201, 'Proveedor creado');
  } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.update(req.params.id, req.body);
    sendSuccess(res, supplier, 200, 'Proveedor actualizado');
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await supplierService.softDelete(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const products = await supplierService.getProducts(req.params.id);
    sendSuccess(res, products);
  } catch (err) { next(err); }
}

export async function getPriceHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, productId } = req.query;
    const history = await supplierService.getPriceHistory(req.params.id, {
      startDate: startDate as string,
      endDate: endDate as string,
      productId: productId as string,
    });
    sendSuccess(res, history);
  } catch (err) { next(err); }
}
