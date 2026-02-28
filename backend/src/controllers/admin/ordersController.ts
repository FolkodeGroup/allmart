/**
 * controllers/admin/ordersController.ts
 * Controlador CRUD para el dominio de pedidos.
 */

import { Response, NextFunction } from 'express';
import * as ordersService from '../../services/ordersService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreateOrderDTO, UpdateOrderDTO } from '../../models/Order';

export async function index(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await ordersService.getAllOrders(_req.query);
    sendSuccess(res, orders);
  } catch (err) { next(err); }
}

export async function show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await ordersService.getOrderById(req.params.id);
    sendSuccess(res, order);
  } catch (err) { next(err); }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await ordersService.createOrder(req.body as CreateOrderDTO);
    sendSuccess(res, order, 201, 'Pedido creado');
  } catch (err) { next(err); }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await ordersService.updateOrder(req.params.id, req.body as UpdateOrderDTO);
    sendSuccess(res, order, 200, 'Pedido actualizado');
  } catch (err) { next(err); }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await ordersService.deleteOrder(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.updateOrderStatus(
      req.params.id,
      req.body
    );

    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
}

export async function updatePayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.updateOrderPaymentStatus(
      req.params.id,
      req.body
    );

    sendSuccess(res, order, 200, 'Estado de pago actualizado');
  } catch (error) {
    next(error);
  }
}