/**
 * controllers/public/promotionsController.ts
 * Controlador público para obtener promociones activas.
 */

import { Request, Response, NextFunction } from 'express';
import * as promotionsService from '../../services/promotionsService';
import * as discountService from '../../services/discountService';

export async function getActivePromotions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const promotions = await promotionsService.getActivePromotions();
    res.json(promotions);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || 'Error interno',
    });
  }
}

export async function getActiveDiscounts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const discounts = await discountService.getActiveDiscounts();
    res.json(discounts);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || 'Error interno',
    });
  }
}

export async function getProductDiscount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productId } = req.params;
    const { price, categoryId, categoryIds } = req.query;

    if (!productId || !price) {
      res.status(400).json({
        message: 'productId y price son requeridos',
      });
      return;
    }

    const categoryList: string[] = [];
    if (typeof categoryId === 'string' && categoryId.trim()) {
      categoryList.push(categoryId);
    }
    if (typeof categoryIds === 'string' && categoryIds.trim()) {
      categoryIds
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => categoryList.push(value));
    }

    const discount = await discountService.getBestDiscount(
      productId,
      parseFloat(price as string),
      Array.from(new Set(categoryList))
    );

    res.json(discount || { message: 'No hay descuentos aplicables' });
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || 'Error interno',
    });
  }
}
