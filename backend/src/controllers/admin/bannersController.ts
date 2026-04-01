/**
 * controllers/admin/bannersController.ts
 * Controlador CRUD para el dominio de banners con imágenes binarias.
 */

import { Response, NextFunction } from 'express';
import * as bannersService from '../../services/bannersService';
import * as bannerImageService from '../../services/bannerImageService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const banners = await bannersService.getAllBanners();
    // No enviar datos binarios de imágenes, solo metadatos
    const response = banners.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description,
      displayOrder: b.displayOrder,
      isActive: b.isActive,
      width: b.width,
      height: b.height,
      thumbWidth: b.thumbWidth,
      thumbHeight: b.thumbHeight,
      sizeBytes: b.sizeBytes,
      originalFilename: b.originalFilename,
      altText: b.altText,
      imageUrl: `/api/images/banners/${b.id}`,
      thumbUrl: `/api/images/banners/${b.id}/thumb`,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));
    sendSuccess(res, response);
  } catch (err) {
    next(err);
  }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const banner = await bannersService.getBannerById(req.params.id);
    const response = {
      id: banner.id,
      title: banner.title,
      description: banner.description,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      width: banner.width,
      height: banner.height,
      thumbWidth: banner.thumbWidth,
      thumbHeight: banner.thumbHeight,
      sizeBytes: banner.sizeBytes,
      originalFilename: banner.originalFilename,
      altText: banner.altText,
      imageUrl: `/api/images/banners/${banner.id}`,
      thumbUrl: `/api/images/banners/${banner.id}/thumb`,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    };
    sendSuccess(res, response);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let { title, description, displayOrder, isActive, altText } = req.body;

    // Convertir a tipos correctos (FormData envía todo como string)
    displayOrder = displayOrder ? parseInt(displayOrder, 10) : 0;
    isActive = isActive === 'true' || isActive === true;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se envió ningún archivo (campo "image")' });
      return;
    }

    const file: bannerImageService.UploadedImageFile = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    const imageData = await bannerImageService.processBannerImage(file);

    const banner = await bannersService.createBanner(
      title,
      description || undefined,
      altText || undefined,
      displayOrder || 0,
      isActive !== false,
      imageData,
    );

    const response = {
      id: banner.id,
      title: banner.title,
      description: banner.description,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      width: banner.width,
      height: banner.height,
      thumbWidth: banner.thumbWidth,
      thumbHeight: banner.thumbHeight,
      sizeBytes: banner.sizeBytes,
      originalFilename: banner.originalFilename,
      altText: banner.altText,
      imageUrl: `/api/images/banners/${banner.id}`,
      thumbUrl: `/api/images/banners/${banner.id}/thumb`,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    };

    sendSuccess(res, response, 201, 'Banner creado y imagen procesada');
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, description, displayOrder, isActive, altText } = req.body;

    const banner = await bannersService.updateBanner(req.params.id, {
      title,
      description: description !== undefined ? description : undefined,
      displayOrder,
      isActive,
      altText: altText !== undefined ? altText : undefined,
    });

    const response = {
      id: banner.id,
      title: banner.title,
      description: banner.description,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      width: banner.width,
      height: banner.height,
      thumbWidth: banner.thumbWidth,
      thumbHeight: banner.thumbHeight,
      sizeBytes: banner.sizeBytes,
      originalFilename: banner.originalFilename,
      altText: banner.altText,
      imageUrl: `/api/images/banners/${banner.id}`,
      thumbUrl: `/api/images/banners/${banner.id}/thumb`,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    };

    sendSuccess(res, response, 200, 'Banner actualizado');
  } catch (err) {
    next(err);
  }
}

export async function updateImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se envió ningún archivo (campo "image")' });
      return;
    }

    const file: bannerImageService.UploadedImageFile = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    const imageData = await bannerImageService.processBannerImage(file);

    const banner = await bannersService.updateBannerImage(req.params.id, imageData);

    const response = {
      id: banner.id,
      title: banner.title,
      description: banner.description,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      width: banner.width,
      height: banner.height,
      thumbWidth: banner.thumbWidth,
      thumbHeight: banner.thumbHeight,
      sizeBytes: banner.sizeBytes,
      originalFilename: banner.originalFilename,
      altText: banner.altText,
      imageUrl: `/api/images/banners/${banner.id}`,
      thumbUrl: `/api/images/banners/${banner.id}/thumb`,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    };

    sendSuccess(res, response, 200, 'Imagen actualizada');
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
    const response = banners.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description,
      displayOrder: b.displayOrder,
      isActive: b.isActive,
      imageUrl: `/api/images/banners/${b.id}`,
      thumbUrl: `/api/images/banners/${b.id}/thumb`,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));
    sendSuccess(res, response, 200, 'Orden de banners actualizado');
  } catch (err) {
    next(err);
  }
}

