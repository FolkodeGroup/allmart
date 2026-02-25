/**
 * middlewares/auth.ts
 * Middlewares de autenticación JWT para rutas protegidas.
 */

import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole, AuthenticatedRequest } from '../types';

/**
 * authMiddleware (Cliente Autenticado)
 * Valida el token JWT y adjunta el payload en req.user.
 * Devuelve 401 si no hay token o es inválido.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Token requerido' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

/**
 * adminMiddleware (Admin/Editor)
 * Verifica el token y valida que el rol sea ADMIN o EDITOR.
 * Devuelve 401 si falla la autenticación, 403 si no tiene permisos.
 */
export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  // Primero reutilizamos la lógica de authMiddleware
  authMiddleware(req, res, () => {
    const role = req.user?.role as UserRole | undefined;

    if (role !== UserRole.ADMIN && role !== UserRole.EDITOR) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado: se requieren permisos de administrador o editor',
      });
      return;
    }

    next();
  });
}
