import { Router } from 'express';
import * as ctrl from '../../controllers/admin/auditLogsController';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/permissions';
import { UserRole } from '../../types';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(UserRole.ADMIN, UserRole.EDITOR));

router.get('/', ctrl.getLogs);
router.post('/', ctrl.createLog);
router.delete('/clear', requireRole(UserRole.ADMIN), ctrl.clearLogs); // Solo admin limpia todo
router.delete('/:id', requireRole(UserRole.ADMIN), ctrl.deleteLog);

export default router;