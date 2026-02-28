/**
 * controllers/public/authController.ts
 * Controlador de autenticación pública (clientes).
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../../services/authService';
import { sendSuccess } from '../../utils/response';

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
      return;
    }
    const result = await authService.loginCustomer(email, password);
    sendSuccess(res, result, 200, 'Autenticación exitosa');
  } catch (err) {
    next(err);
  }
}

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, email, password } = req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    };

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'El formato del email no es válido' });
      return;
    }

    const result = await authService.registerCustomer(firstName, lastName, email, password);
    sendSuccess(res, result, 201, 'Registro exitoso');
  } catch (err) {
    next(err);
  }
}
