/**
 * middlewares/errorHandler.ts
 * Middleware global de manejo de errores.
 * Debe registrarse ÚLTIMO en la cadena de middlewares de Express.
 */

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  errors?: string[];
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Error interno del servidor';

  console.error(`[ERROR] ${statusCode} - ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
}

/** Helper para crear errores con código HTTP */
export function createError(message: string, statusCode = 500, errors?: string[]): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  if (errors) error.errors = errors;
  return error;
}
