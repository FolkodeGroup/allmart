/**
 * controllers/admin/productsController.ts
 * Controlador CRUD para el dominio de productos.
 */

import { Response, NextFunction } from 'express';
import * as productsService from '../../services/productsService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreateProductDTO, UpdateProductDTO } from '../../models/Product';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, categoryId, page, limit } = req.query;
    const result = await productsService.getAdminProducts({
      q: q as string,
      categoryId: categoryId as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.getProductById(req.params.id);
    sendSuccess(res, product);
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.createProduct(req.body as CreateProductDTO);
    sendSuccess(res, product, 201, 'Producto creado');
  } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.updateProduct(req.params.id, req.body as UpdateProductDTO);
    sendSuccess(res, product, 200, 'Producto actualizado');
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await productsService.deleteProduct(req.params.id);
    sendSuccess(res, null, 200, 'Producto eliminado');
  } catch (err) { next(err); }
}
