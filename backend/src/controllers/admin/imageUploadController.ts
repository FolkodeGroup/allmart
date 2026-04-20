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
import * as legacyImages from '../../services/productImagesService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

function isNotFoundError(err: unknown): boolean {
  return Boolean(
    err &&
    typeof err === 'object' &&
    'statusCode' in err &&
    (err as { statusCode?: number }).statusCode === 404,
  );
}

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
    const productId = req.params.productId;
    const storageImages = await imgStorage.getProductImages(productId);
    const storageUrls = new Set(storageImages.map((img: any) => img.url));

    const legacyImagesList = await legacyImages.getImagesByProduct(productId);
    const legacyImagesMapped = legacyImagesList
      .filter((img) => !storageUrls.has(img.url))
      .map((img) => ({
        ...img,
        thumbUrl: img.url.startsWith('/api/images/products/') && !img.url.endsWith('/thumb')
          ? `${img.url}/thumb`
          : undefined,
      }));

    const combined = [...storageImages, ...legacyImagesMapped]
      .sort((a, b) => a.position - b.position);

    sendSuccess(res, combined);
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
    if (isNotFoundError(err)) {
      try {
        const legacyImage = await legacyImages.getImageById(req.params.id);
        const thumbUrl = legacyImage.url.startsWith('/api/images/products/') && !legacyImage.url.endsWith('/thumb')
          ? `${legacyImage.url}/thumb`
          : undefined;
        sendSuccess(res, { ...legacyImage, thumbUrl });
        return;
      } catch (legacyErr) {
        next(legacyErr);
        return;
      }
    }
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
    const normalizedPosition = position !== undefined ? parseInt(position, 10) : undefined;

    try {
      const image = await imgStorage.updateProductImageMeta(req.params.id, {
        altText,
        position: normalizedPosition,
      });
      sendSuccess(res, image, 200, 'Metadatos de imagen actualizados');
    } catch (err) {
      if (isNotFoundError(err)) {
        const legacyImage = await legacyImages.updateImage(req.params.id, {
          altText,
          position: normalizedPosition,
        });
        const thumbUrl = legacyImage.url.startsWith('/api/images/products/') && !legacyImage.url.endsWith('/thumb')
          ? `${legacyImage.url}/thumb`
          : undefined;
        sendSuccess(res, { ...legacyImage, thumbUrl }, 200, 'Metadatos de imagen actualizados');
        return;
      }
      throw err;
    }
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
    try {
      await imgStorage.deleteProductImage(req.params.id);
      sendSuccess(res, null, 200, 'Imagen eliminada');
    } catch (err) {
      if (isNotFoundError(err)) {
        await legacyImages.deleteImage(req.params.id);
        sendSuccess(res, null, 200, 'Imagen eliminada');
        return;
      }
      throw err;
    }
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
