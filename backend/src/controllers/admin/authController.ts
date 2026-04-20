/**
 * controllers/admin/authController.ts
 * Controlador de autenticación del panel de administración.
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../../services/authService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function changePasswordController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'currentPassword y newPassword son requeridos' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    await authService.changePassword(userId, currentPassword, newPassword);
    sendSuccess(res, null, 200, 'Contraseña actualizada correctamente');
  } catch (err) {
    next(err);
  }
}

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
