/**
 * routes/admin/auth.ts
 * Rutas de autenticación del panel de administración.
 * POST /api/admin/auth/login
 */

import { Router } from 'express';
import { loginController, changePasswordController } from '../../controllers/admin/authController';
import { adminMiddleware } from '../../middlewares/auth';

const router = Router();

router.post('/login', loginController);
router.put('/change-password', adminMiddleware, changePasswordController);

export default router;
