/**
 * controllers/public/categoriesController.ts
 * Controlador de lectura para categorías público.
 */

import { Request, Response, NextFunction } from 'express';
import * as categoriesService from '../../services/categoriesService';
import { sendSuccess } from '../../utils/response';

export async function index(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await categoriesService.getAllActiveCategories();
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

export async function showBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { slug } = req.params;
    const category = await categoriesService.getCategoryBySlug(slug);
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
}
