/**
 * services/authService.ts
 * Lógica de negocio para autenticación de administradores.
 * Actualmente usa usuarios en memoria; migrar a BD cuando esté disponible.
 */

import { env } from '../config/env';
import { comparePassword } from '../utils/bcrypt';
import { signToken } from '../utils/jwt';
import { UserRole } from '../types';

interface InMemoryUser {
  user: string;
  hash: string;
  role: UserRole;
}

// En memoria hasta integrar BD
const USERS: InMemoryUser[] = [
  { user: env.ADMIN_USER,  hash: env.ADMIN_HASH,  role: UserRole.ADMIN  },
  { user: env.EDITOR_USER, hash: env.EDITOR_HASH, role: UserRole.EDITOR },
];

export interface LoginResult {
  token: string;
  role: UserRole;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const found = USERS.find(u => u.user === username);
  if (!found) throw Object.assign(new Error('Usuario inválido'), { statusCode: 401 });

  const valid = await comparePassword(password, found.hash);
  if (!valid) throw Object.assign(new Error('Contraseña incorrecta'), { statusCode: 401 });

  const token = signToken({ user: found.user, role: found.role });
  return { token, role: found.role };
}
