import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../../middlewares/auth';
import { requireRole } from '../../../middlewares/permissions';
import { UserRole } from '../../../types';
import * as ctrl from '../../../controllers/admin/skuImageController';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.post('/upload', requireRole(UserRole.ADMIN, UserRole.EDITOR), upload.single('image'), ctrl.uploadSkuImage);
router.get('/', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.listSkuImages);
router.get('/:id', requireRole(UserRole.ADMIN, UserRole.EDITOR), ctrl.showSkuImageMeta);
router.patch('/:id/meta', requireRole(UserRole.ADMIN), ctrl.updateSkuImageMeta);
router.delete('/:id', requireRole(UserRole.ADMIN), ctrl.deleteSkuImage);

export default router;
