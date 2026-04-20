/**
 * routes/admin/categories.ts
 * Rutas del dominio de categorías.
 *
 * Prefijo: /api/admin/categories
 *
 * Endpoints de imagen binaria:
 *   POST   /:categoryId/image/upload  → subir imagen WebP (campo "image")
 *   GET    /:categoryId/image         → metadatos de la imagen
 *   DELETE /:categoryId/image         → eliminar imagen
 */

import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../../controllers/admin/categoriesController';
import * as uploadCtrl from '../../controllers/admin/imageUploadController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  },
});

const router = Router();

router.use(authMiddleware);

// ── Imagen de categoría ────────────────────────────────────────────────────────
router.post(
  '/:categoryId/image/upload',
  requireRole(UserRole.ADMIN, UserRole.EDITOR),
  upload.single('image'),
  uploadCtrl.uploadCategoryImage,
);
router.get('/:categoryId/image',    requireRole(UserRole.ADMIN, UserRole.EDITOR), uploadCtrl.showCategoryImageMeta);
router.delete('/:categoryId/image', requireRole(UserRole.ADMIN), uploadCtrl.removeCategoryImage);

// ── CRUD categorías ───────────────────────────────────────────────────────────
router.get('/',    requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.index);
router.get('/:id', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.show);
router.post('/',   requireRole(UserRole.ADMIN), ctrl.create);
router.put('/:id', requireRole(UserRole.ADMIN), ctrl.update);
router.delete('/:id', requireRole(UserRole.ADMIN), ctrl.remove);

export default router;
