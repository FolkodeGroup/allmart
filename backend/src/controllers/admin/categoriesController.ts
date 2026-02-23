/**
 * controllers/admin/categoriesController.ts
 * Controlador CRUD para el dominio de categorías.
 */

import { Response, NextFunction } from 'express';
import * as categoriesService from '../../services/categoriesService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../../models/Category';

export async function index(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await categoriesService.getAllCategories();
    sendSuccess(res, categories);
  } catch (err) { next(err); }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);
    sendSuccess(res, category);
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await categoriesService.createCategory(req.body as CreateCategoryDTO);
    sendSuccess(res, category, 201, 'Categoría creada');
  } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await categoriesService.updateCategory(req.params.id, req.body as UpdateCategoryDTO);
    sendSuccess(res, category, 200, 'Categoría actualizada');
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await categoriesService.deleteCategory(req.params.id);
    sendSuccess(res, null, 200, 'Categoría eliminada');
  } catch (err) { next(err); }
}
