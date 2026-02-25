/**
 * types/index.ts
 * Tipos globales reutilizables en toda la aplicación.
 * Re-exporta también los enums para facilitar imports.
 */

export * from './enums';

// ─── Payload JWT ──────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  user: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ─── Respuesta estándar de la API ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// ─── Paginación ───────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// ─── Extensión de Express Request ─────────────────────────────────────────────
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
