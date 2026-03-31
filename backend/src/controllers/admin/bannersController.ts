/**
 * controllers/admin/bannersController.ts
 * Controlador CRUD para el dominio de banners.
 */

import { Response, NextFunction } from 'express';
import * as bannersService from '../../services/bannersService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreateBannerDTO, UpdateBannerDTO } from '../../models/Banner';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const banners = await bannersService.getAllBanners();
    sendSuccess(res, banners);
  } catch (err) {
    next(err);
  }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const banner = await bannersService.getBannerById(req.params.id);
    sendSuccess(res, banner);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const banner = await bannersService.createBanner(req.body as CreateBannerDTO);
    sendSuccess(res, banner, 201, 'Banner creado');
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const banner = await bannersService.updateBanner(req.params.id, req.body as UpdateBannerDTO);
    sendSuccess(res, banner, 200, 'Banner actualizado');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await bannersService.deleteBanner(req.params.id);
    sendSuccess(res, null, 200, 'Banner eliminado');
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { bannerIds } = req.body as { bannerIds: string[] };
    if (!Array.isArray(bannerIds)) {
      throw new Error('bannerIds debe ser un array');
    }
    const banners = await bannersService.reorderBanners(bannerIds);
    sendSuccess(res, banners, 200, 'Orden de banners actualizado');
  } catch (err) {
    next(err);
  }
}
