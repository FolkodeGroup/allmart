/**
 * routes/admin/products/images.ts
 * Rutas de imágenes de producto (subdominio de products).
 *
 * Prefijo: /api/admin/products/:productId/images
 *
 * Endpoints disponibles:
 *   GET    /                        → listar metadatos (almacenamiento binario)
 *   GET    /:id                     → metadatos de una imagen
 *   POST   /upload                  → subir archivo (multipart/form-data, campo "image")
 *   PATCH  /:id/meta                → actualizar altText / position
 *   DELETE /:id                     → eliminar imagen
 *
 * Endpoints legacy (URL-based, mantenidos para compatibilidad):
 *   POST   /                        → crear imagen por URL
 *   PUT    /:id                     → actualizar imagen por URL
 */

import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../../../controllers/admin/productImagesController';
import * as uploadCtrl from '../../../controllers/admin/imageUploadController';
import { authMiddleware } from '../../../middlewares/auth';
import { requireRole } from '../../../middlewares/permissions';
import { UserRole } from '../../../types';

// multer en memoria (sin tocar disco) — la imagen se pasa directo a sharp/DB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

const router = Router({ mergeParams: true }); // mergeParams para acceder a :productId

router.use(authMiddleware);

// ── Almacenamiento binario (nuevos endpoints) ─────────────────────────────────
router.post(
  '/upload',
  requireRole(UserRole.ADMIN, UserRole.EDITOR),
  upload.single('image'),
  uploadCtrl.uploadProductImage,
);

router.get('/',       requireRole(UserRole.ADMIN, UserRole.EDITOR), uploadCtrl.listProductImages);
router.get('/:id',    requireRole(UserRole.ADMIN, UserRole.EDITOR), uploadCtrl.showProductImageMeta);
router.patch('/:id/meta', requireRole(UserRole.ADMIN), uploadCtrl.updateProductImageMeta);
router.delete('/:id', requireRole(UserRole.ADMIN), uploadCtrl.removeProductImage);

// ── Legacy URL-based (mantenidos para compatibilidad) ────────────────────────
router.post('/',      requireRole(UserRole.ADMIN), ctrl.create);
router.put('/:id',    requireRole(UserRole.ADMIN), ctrl.update);

export default router;
