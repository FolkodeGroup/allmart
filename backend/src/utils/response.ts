/**
 * utils/response.ts
 * Helpers para construir respuestas HTTP estandarizadas.
 * Garantiza un formato consistente en toda la API.
 */

import { Response } from 'express';
import { ApiResponse, PaginationMeta, PaginatedResponse } from '../types';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): any {
  const body: ApiResponse<T> = { success: true, data, ...(message ? { message } : {}) };
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, message: string, statusCode = 400, errors?: string[]): any {
  const body: ApiResponse = { success: false, message, ...(errors ? { errors } : {}) };
  return res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200,
): void {
  const body: PaginatedResponse<T> = { success: true, data, meta };
  res.status(statusCode).json(body);
}
