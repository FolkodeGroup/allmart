/**
 * routes/admin/auth.ts
 * Rutas de autenticación del panel de administración.
 * POST /api/admin/auth/login
 */

import { Router } from 'express';
import { loginController } from '../../controllers/admin/authController';

const router = Router();

router.post('/login', loginController);

export default router;
