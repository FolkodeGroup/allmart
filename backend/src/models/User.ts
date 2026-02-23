/**
 * models/User.ts
 * Modelo de datos del usuario / administrador del sistema.
 * Cuando se integre una BD, este modelo se convierte en esquema ORM/ODM.
 */

import { UserRole } from '../types';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Datos para crear un usuario (sin id ni fechas, generadas por el sistema) */
export type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

/** Datos públicos de usuario (sin hash de contraseña) */
export type PublicUser = Omit<User, 'passwordHash'>;
