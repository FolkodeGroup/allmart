/**
 * controllers/public/bannersController.ts
 * Controlador público para obtener banners activos.
 */

import { Response, NextFunction, Request } from 'express';
import * as bannersService from '../../services/bannersService';
import { sendSuccess } from '../../utils/response';

export async function getActiveBanners(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const banners = await bannersService.getActiveBanners();
    sendSuccess(res, banners);
  } catch (err) {
    next(err);
  }
}
