/**
 * services/usersService.ts
 * Lógica de negocio para el módulo de usuarios.
 * Preparado para cuando se integre una base de datos.
 */

import { v4 as uuidv4 } from 'uuid';
import { User, CreateUserDTO, PublicUser } from '../models/User';
import { hashPassword } from '../utils/bcrypt';
import { createError } from '../middlewares/errorHandler';

const store: Map<string, User> = new Map();

export async function getAllUsers(): Promise<PublicUser[]> {
  return Array.from(store.values()).map(({ passwordHash: _, ...rest }) => rest);
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = store.get(id);
  if (!user) throw createError('Usuario no encontrado', 404);
  const { passwordHash: _, ...rest } = user;
  return rest;
}

export async function createUser(dto: Omit<CreateUserDTO, 'passwordHash'> & { password: string }): Promise<PublicUser> {
  const { password, ...rest } = dto;
  const passwordHash = await hashPassword(password);
  const now = new Date();
  const user: User = { ...rest, passwordHash, id: uuidv4(), createdAt: now, updatedAt: now };
  store.set(user.id, user);
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}

export async function deleteUser(id: string): Promise<void> {
  if (!store.has(id)) throw createError('Usuario no encontrado', 404);
  store.delete(id);
}
