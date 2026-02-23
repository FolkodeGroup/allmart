/**
 * controllers/admin/usersController.ts
 * Controlador CRUD para el módulo de usuarios.
 */

import { Response, NextFunction } from 'express';
import * as usersService from '../../services/usersService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export async function index(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await usersService.getAllUsers();
    sendSuccess(res, users);
  } catch (err) { next(err); }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getUserById(req.params.id);
    sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.createUser(req.body);
    sendSuccess(res, user, 201, 'Usuario creado');
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.deleteUser(req.params.id);
    sendSuccess(res, null, 200, 'Usuario eliminado');
  } catch (err) { next(err); }
}
