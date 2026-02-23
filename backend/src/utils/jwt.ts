/**
 * utils/jwt.ts
 * Helpers para firmar y verificar tokens JWT.
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn = '2h'): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
