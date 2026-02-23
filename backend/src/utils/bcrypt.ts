/**
 * utils/bcrypt.ts
 * Helpers para hashear y comparar contraseñas con bcrypt.
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
