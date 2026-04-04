/**
 * routes/admin/banners.ts
 * Rutas para gestionar banners de la homepage con imágenes binarias.
 *
 * Prefijo: /api/admin/banners
 */

import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../../controllers/admin/bannersController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../types';

// multer en memoria (sin tocar disco)
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

const router = Router();

router.use(authMiddleware);

// ─── CRUD banners ─────────────────────────────────────────────────────────────
router.get('/', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.index);
router.get('/:id', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.show);
router.post('/', requireRole(UserRole.ADMIN), upload.single('image'), ctrl.create);
router.put('/:id', requireRole(UserRole.ADMIN), ctrl.update);
router.patch('/:id/image', requireRole(UserRole.ADMIN), upload.single('image'), ctrl.updateImage);
router.delete('/:id', requireRole(UserRole.ADMIN), ctrl.remove);
router.post('/reorder', requireRole(UserRole.ADMIN), ctrl.reorder);

export default router;
