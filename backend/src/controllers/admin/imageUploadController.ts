/**
 * controllers/admin/imageUploadController.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Controlador de subida de imágenes binarias para productos y categorías.
 *
 * Endpoints que maneja:
 *   POST /api/admin/products/:productId/images/upload   → uploadProductImage
 *   POST /api/admin/categories/:categoryId/image/upload → uploadCategoryImage
 *   PATCH /api/admin/products/:productId/images/:id/meta → updateProductImageMeta
 *   DELETE /api/admin/products/:productId/images/:id    → removeProductImage
 *   GET  /api/admin/products/:productId/images          → listProductImages
 *   GET  /api/admin/categories/:categoryId/image        → getCategoryImageMeta
 *   DELETE /api/admin/categories/:categoryId/image      → removeCategoryImage
 */

import { Response, NextFunction } from 'express';
import * as imgStorage from '../../services/imageStorageService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

// ─── Productos ─────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/products/:productId/images/upload
 * Body: multipart/form-data — campo "image" (archivo), campo opcional "altText", "position"
 */
export async function uploadProductImage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { productId } = req.params;
    const { altText, position } = req.body;

    // multer pone el archivo en req.file
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se envió ningún archivo (campo "image")' });
      return;
    }

    const file: imgStorage.UploadedImageFile = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    const image = await imgStorage.uploadProductImage(
      productId,
      file,
      altText,
      position !== undefined ? parseInt(position, 10) : undefined,
    );

    sendSuccess(res, image, 201, 'Imagen subida y convertida a WebP correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/products/:productId/images
 * Lista los metadatos de las imágenes de un producto (sin binarios).
 */
export async function listProductImages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const images = await imgStorage.getProductImages(req.params.productId);
    sendSuccess(res, images);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/products/:productId/images/:id
 * Metadatos de una imagen individual.
 */
export async function showProductImageMeta(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const image = await imgStorage.getProductImageMeta(req.params.id);
    sendSuccess(res, image);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/products/:productId/images/:id/meta
 * Actualiza altText y/o position sin reemplazar el binario.
 */
export async function updateProductImageMeta(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { altText, position } = req.body;
    const image = await imgStorage.updateProductImageMeta(req.params.id, {
      altText,
      position: position !== undefined ? parseInt(position, 10) : undefined,
    });
    sendSuccess(res, image, 200, 'Metadatos de imagen actualizados');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/products/:productId/images/:id
 */
export async function removeProductImage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await imgStorage.deleteProductImage(req.params.id);
    sendSuccess(res, null, 200, 'Imagen eliminada');
  } catch (err) {
    next(err);
  }
}

// ─── Categorías ────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/categories/:categoryId/image/upload
 * Upsert: reemplaza la imagen de la categoría si ya existía.
 */
export async function uploadCategoryImage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { categoryId } = req.params;
    const { altText } = req.body;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se envió ningún archivo (campo "image")' });
      return;
    }

    const file: imgStorage.UploadedImageFile = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    const image = await imgStorage.uploadCategoryImage(categoryId, file, altText);
    sendSuccess(res, image, 201, 'Imagen de categoría subida correctamente');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/categories/:categoryId/image
 * Metadatos de la imagen de una categoría.
 */
export async function showCategoryImageMeta(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const image = await imgStorage.getCategoryImageMeta(req.params.categoryId);
    sendSuccess(res, image);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/categories/:categoryId/image
 */
export async function removeCategoryImage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await imgStorage.deleteCategoryImage(req.params.categoryId);
    sendSuccess(res, null, 200, 'Imagen de categoría eliminada');
  } catch (err) {
    next(err);
  }
}
