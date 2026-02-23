/**
 * middlewares/permissions.ts
 * Factory de middleware de autorización por roles.
 * Uso: requireRole(UserRole.ADMIN) en los router.
 */

import { Response, NextFunction } from 'express';
import { UserRole, AuthenticatedRequest } from '../types';

/**
 * Retorna un middleware que verifica que el usuario tenga
 * al menos uno de los roles indicados.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRole = req.admin?.role as UserRole | undefined;

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado: permisos insuficientes',
      });
      return;
    }
    next();
  };
}
