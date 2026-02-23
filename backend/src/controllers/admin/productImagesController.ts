/**
 * controllers/admin/productImagesController.ts
 * Controlador CRUD para imágenes de producto.
 * Subdominio de products.
 */

import { Response, NextFunction } from 'express';
import * as imagesService from '../../services/productImagesService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreateProductImageDTO, UpdateProductImageDTO } from '../../models/ProductImage';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const images = await imagesService.getImagesByProduct(req.params.productId);
    sendSuccess(res, images);
  } catch (err) { next(err); }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const image = await imagesService.getImageById(req.params.id);
    sendSuccess(res, image);
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto: CreateProductImageDTO = { ...req.body, productId: req.params.productId };
    const image = await imagesService.createImage(dto);
    sendSuccess(res, image, 201, 'Imagen creada');
  } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const image = await imagesService.updateImage(req.params.id, req.body as UpdateProductImageDTO);
    sendSuccess(res, image, 200, 'Imagen actualizada');
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await imagesService.deleteImage(req.params.id);
    sendSuccess(res, null, 200, 'Imagen eliminada');
  } catch (err) { next(err); }
}
