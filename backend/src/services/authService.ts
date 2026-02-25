/**
 * services/authService.ts
 * Lógica de negocio para autenticación de administradores.
 * Valida credenciales contra la tabla users de la base de datos.
 */

import { pool } from '../config/db';
import { comparePassword, hashPassword } from '../utils/bcrypt';
import { signToken } from '../utils/jwt';
import { UserRole } from '../types';

export interface RegistrationResult {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginResult {
  token: string;
  role: UserRole;
  userId: string;
}

/**
 * login (Administración)
 * Valida credenciales contra la tabla users de la base de datos
 * solo para roles admin y editor.
 */
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
  return { token, role: user.role, userId: user.id };
}

/**
 * loginCustomer (Público)
 * Valida credenciales contra la tabla users para clientes.
 * El token expira en 24h.
 */
export async function loginCustomer(email: string, password: string): Promise<LoginResult> {
  const { rows } = await pool.query<{ id: string; email: string; password_hash: string; role: UserRole }>(
    `SELECT id, email, password_hash, role
     FROM users
     WHERE email = $1
       AND is_active = TRUE
     LIMIT 1`,
    [email]
  );

  if (rows.length === 0) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const user = rows[0];

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  // El token JWT expira en 24 horas como solicita el issue
  const token = signToken({ userId: user.id, user: user.email, role: user.role }, '24h');
  return { token, role: user.role, userId: user.id };
}

/**
 * registerCustomer (Público)
 * Crea un nuevo usuario con rol customer.
 */
export async function registerCustomer(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<RegistrationResult> {
  // Verificar si el email ya existe
  const { rows: existingRows } = await pool.query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  if (existingRows.length > 0) {
    throw Object.assign(new Error('El email ya se encuentra registrado'), { statusCode: 409 });
  }

  const passwordHash = await hashPassword(password);

  const { rows } = await pool.query<{ id: string; email: string; role: string }>(
    `INSERT INTO users (first_name, last_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, role`,
    [firstName, lastName, email, passwordHash, UserRole.CUSTOMER]
  );

  const newUser = rows[0];
  return {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role as UserRole,
  };
}
