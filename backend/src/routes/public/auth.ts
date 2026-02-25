/**
 * routes/public/auth.ts
 * Rutas de autenticación pública (clientes).
 * POST /api/auth/login
 */

import { Router } from 'express';
import { loginController } from '../../controllers/public/authController';

const router = Router();

router.post('/login', loginController);

export default router;
