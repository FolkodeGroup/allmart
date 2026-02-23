/**
 * controllers/admin/authController.ts
 * Controlador de autenticación del panel de administración.
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../../services/authService';
import { sendSuccess } from '../../utils/response';

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, password } = req.body as { user?: string; password?: string };
    if (!user || !password) {
      res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
      return;
    }
    const result = await authService.login(user, password);
    sendSuccess(res, result, 200, 'Autenticación exitosa');
  } catch (err) {
    next(err);
  }
}
