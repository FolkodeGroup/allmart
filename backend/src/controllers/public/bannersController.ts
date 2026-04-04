/**
 * controllers/public/bannersController.ts
 * Controlador público para obtener banners activos y servir imágenes.
 */

import { Response, NextFunction, Request } from 'express';
import * as bannersService from '../../services/bannersService';
import { sendSuccess } from '../../utils/response';

export async function getActiveBanners(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const banners = await bannersService.getActiveBannersPublic();
    sendSuccess(res, banners);
  } catch (err) {
    next(err);
  }
}

export async function getBannerImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const imageData = await bannersService.getBannerImageData(id);
    
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(imageData.data);
  } catch (err) {
    next(err);
  }
}

export async function getBannerThumbnail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const imageData = await bannersService.getBannerThumbnail(id);
    
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(imageData.data);
  } catch (err) {
    next(err);
  }
}

