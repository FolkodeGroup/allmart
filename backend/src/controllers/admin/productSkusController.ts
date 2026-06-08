import { Response, NextFunction } from 'express';
import * as skusService from '../../services/productSkusService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const list = await skusService.getSkusByProduct(req.params.productId);
        return sendSuccess(res, list);
    } catch (err) { next(err); }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const sku = await skusService.getSkuById(req.params.productId, req.params.skuId);
        return sendSuccess(res, sku);
    } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const created = await skusService.createSku(req.params.productId, req.body);
        return sendSuccess(res, created, 201, 'SKU creado');
    } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const updated = await skusService.updateSku(req.params.productId, req.params.skuId, req.body);
        return sendSuccess(res, updated, 200, 'SKU actualizado');
    } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        await skusService.deleteSku(req.params.productId, req.params.skuId);
        return sendSuccess(res, null, 200, 'SKU eliminado');
    } catch (err) { next(err); }
}
