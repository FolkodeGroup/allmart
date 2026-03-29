/**
 * controllers/public/collectionsController.ts
 * Controlador público para obtener colecciones.
 */

import { Request, Response, NextFunction } from 'express';
import * as collectionsService from '../../services/collectionsService';

export async function getCollection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;
    const collection = await collectionsService.getCollectionBySlug(slug);
    res.json(collection);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || 'Error interno',
    });
  }
}

export async function getCollectionsByPosition(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { position } = req.params;
    if (position !== 'home' && position !== 'category') {
      res.status(400).json({
        message: 'position debe ser "home" o "category"',
      });
      return;
    }

    const collections = await collectionsService.getCollectionsByDisplayPosition(
      position as any
    );
    res.json(collections);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || 'Error interno',
    });
  }
}

export async function getHomeCollections(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const collections = await collectionsService.getCollectionsByDisplayPosition('home');
    res.json(collections);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || 'Error interno',
    });
  }
}
