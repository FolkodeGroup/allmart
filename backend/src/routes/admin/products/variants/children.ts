import { Router } from 'express';
import * as ctrl from '../../../../controllers/admin/productSkusController';
import { authMiddleware } from '../../../../middlewares/auth';
import { requireRole } from '../../../../middlewares/permissions';
import { UserRole } from '../../../../types';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', requireRole(UserRole.ADMIN), ctrl.index);
router.get('/:skuId', requireRole(UserRole.ADMIN), ctrl.show);
router.post('/', requireRole(UserRole.ADMIN), ctrl.create);
router.put('/:skuId', requireRole(UserRole.ADMIN), ctrl.update);
router.delete('/:skuId', requireRole(UserRole.ADMIN), ctrl.remove);

export default router;
