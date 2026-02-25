/**
 * routes/public/auth.ts
 * Rutas de autenticación pública (clientes).
 * POST /api/auth/login
 */

import { Router } from 'express';
import { loginController, registerController } from '../../controllers/public/authController';

const router = Router();

router.post('/login',    loginController);
router.post('/register', registerController);

export default router;
