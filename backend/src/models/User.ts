/**
 * models/User.ts
 * Modelo de datos del usuario alineado con la tabla PostgreSQL `users`.
 * Refleja exactamente los campos de migrations/001_create_users.sql.
 */

import { UserRole } from '../types';

// ─── Entidad completa (espejo de la fila en BD) ───────────────────────────────
export interface User {
  id:           string;
  firstName:    string;
  lastName:     string;
  email:        string;
  passwordHash: string;
  role:         UserRole;
  isActive:     boolean;
  createdAt:    Date;
  updatedAt:    Date;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/** Datos para crear un usuario nuevo (sin id ni timestamps) */
export type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

/** Actualización parcial de usuario */
export type UpdateUserDTO = Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>>;

/** Vista pública: sin hash de contraseña */
export type PublicUser = Omit<User, 'passwordHash'>;
