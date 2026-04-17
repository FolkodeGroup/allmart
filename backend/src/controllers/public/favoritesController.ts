/**
 * controllers/public/favoritesController.ts
 * Controlador para favoritos de usuario.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as favoritesService from '../../services/favoritesService';

/** GET /api/favorites (mis favoritos) */
export const index = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const favorites = await favoritesService.getUserFavorites(userId);
    res.json({ data: favorites });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};

/** POST /api/favorites/:productId (toggle) */
export const toggle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;
    const result = await favoritesService.toggleFavorite(userId, productId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};

/** GET /api/favorites/:productId/check */
export const check = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;
    const result = await favoritesService.checkFavorite(userId, productId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};

/** DELETE /api/favorites/:productId */
export const destroy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;
    await favoritesService.removeFavorite(userId, productId);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error interno' });
  }
};
