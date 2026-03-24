import { Router } from 'express';
import * as staffNotesController from '../../controllers/admin/staffNotesController';
import { requireRole } from '../../middlewares/permissions';
import { adminMiddleware } from '../../middlewares/auth';
import { UserRole } from '../../types';

const router = Router();

// Todas las rutas requieren autenticación y rol admin
router.use(adminMiddleware, requireRole(UserRole.ADMIN));

router.get('/', staffNotesController.getAll);
router.get('/:id', staffNotesController.getById);
router.post('/', staffNotesController.create);
router.put('/:id', staffNotesController.update);
router.delete('/:id', staffNotesController.remove);

export default router;