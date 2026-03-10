/**
 * services/authService.ts
 * Lógica de negocio para autenticación de administradores.
 * Valida credenciales contra la tabla users usando Prisma Client.
 */

import { prisma } from '../config/prisma';
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
 * Valida credenciales contra la tabla users usando Prisma.
 * Solo para roles admin y editor.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findFirst({
    where: {
      email: email,
      role: { in: ['admin', 'editor'] },
      isActive: true,
    },
    select: { id: true, email: true, passwordHash: true, role: true },
  });

  if (!user) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const role = user.role as unknown as UserRole;
  const token = signToken({ userId: user.id, email: user.email, role });
  return { token, role, userId: user.id };
}

/**
 * loginCustomer (Público)
 * Valida credenciales para clientes. El token expira en 24h.
 */
export async function loginCustomer(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findFirst({
    where: {
      email,
      isActive: true,
    },
    select: { id: true, email: true, passwordHash: true, role: true },
  });

  if (!user) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const role = user.role as unknown as UserRole;
  const token = signToken({ userId: user.id, user: user.email, role }, '24h');
  return { token, role, userId: user.id };
}

/**
 * registerCustomer (Público)
 * Crea un nuevo usuario con rol customer usando Prisma.
 */
export async function registerCustomer(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<RegistrationResult> {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw Object.assign(new Error('El email ya se encuentra registrado'), { statusCode: 409 });
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      role: 'customer',
    },
    select: { id: true, email: true, role: true },
  });

  return {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role as unknown as UserRole,
  };
}

