/**
 * services/usersService.ts
 * Lógica de negocio para el módulo de usuarios usando Prisma Client.
 */

import { UserRole as PrismaUserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { User, CreateUserDTO, PublicUser } from '../models/User';
import { UserRole } from '../types';
import { hashPassword } from '../utils/bcrypt';
import { createError } from '../middlewares/errorHandler';

// Mapea la fila Prisma a PublicUser (sin passwordHash)
function toPublicUser(row: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    role: row.role as UserRole,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const PUBLIC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getAllUsers(): Promise<PublicUser[]> {
  const rows = await prisma.user.findMany({
    select: PUBLIC_SELECT,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toPublicUser);
}

export async function getUserById(id: string): Promise<PublicUser> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_SELECT,
  });
  if (!row) throw createError('Usuario no encontrado', 404);
  return toPublicUser(row);
}

export async function createUser(
  dto: Omit<CreateUserDTO, 'passwordHash'> & { password: string }
): Promise<PublicUser> {
  const { password, ...rest } = dto;
  const passwordHash = await hashPassword(password);

  const row = await prisma.user.create({
    data: {
      firstName: rest.firstName,
      lastName: rest.lastName,
      email: rest.email,
      passwordHash,
      role: ((rest.role as string) || 'customer') as PrismaUserRole,
      isActive: rest.isActive ?? true,
    },
    select: PUBLIC_SELECT,
  });

  return toPublicUser(row);
}

export async function deleteUser(id: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw createError('Usuario no encontrado', 404);
  await prisma.user.delete({ where: { id } });
}

