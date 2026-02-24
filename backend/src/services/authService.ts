/**
 * services/authService.ts
 * Lógica de negocio para autenticación de administradores.
 * Valida credenciales contra la tabla users de la base de datos.
 */

import { pool } from '../config/db';
import { comparePassword } from '../utils/bcrypt';
import { signToken } from '../utils/jwt';
import { UserRole } from '../types';

export interface LoginResult {
  token: string;
  role: UserRole;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  // Solo admin y editor tienen acceso al panel de administración
  const { rows } = await pool.query<{ id: string; email: string; password_hash: string; role: UserRole }>(
    `SELECT id, email, password_hash, role
     FROM users
     WHERE email = $1
       AND role IN ('admin', 'editor')
       AND is_active = TRUE
     LIMIT 1`,
    [username]
  );

  if (rows.length === 0) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const user = rows[0];

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const token = signToken({ userId: user.id, user: user.email, role: user.role });
  return { token, role: user.role };
}
