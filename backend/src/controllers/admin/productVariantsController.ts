/**
 * controllers/admin/productVariantsController.ts
 * Controlador CRUD para variantes de producto.
 * Subdominio de products.
 */

import { Response, NextFunction } from 'express';
import * as variantsService from '../../services/productVariantsService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreateProductVariantDTO, UpdateProductVariantDTO } from '../../models/ProductVariant';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const variants = await variantsService.getVariantsByProduct(req.params.productId);
    return sendSuccess(res, variants);
  } catch (err) { next(err); }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const variant = await variantsService.getVariantById(req.params.productId, req.params.variantId);
    return sendSuccess(res, variant);
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const variant = await variantsService.createVariant(req.params.productId, req.body);
    return sendSuccess(res, variant, 201, 'Variante creada');
  } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const variant = await variantsService.updateVariant(req.params.productId, req.params.variantId, req.body as UpdateProductVariantDTO);
    return sendSuccess(res, variant, 200, 'Variante actualizada');
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await variantsService.deleteVariant(req.params.productId, req.params.variantId);
    return sendSuccess(res, null, 200, 'Variante eliminada');
  } catch (err) { next(err); }
}
