/**
 * controllers/admin/ordersController.ts
 * Controlador CRUD para el dominio de pedidos con Auditoría integrada.
 */

import { Response, NextFunction } from 'express';
import * as ordersService from '../../services/ordersService';
import * as auditService from '../../services/auditService';
import { generateOrdersPdf, OrderPdfInput } from '../../services/ordersPdfService';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';
import { CreateOrderDTO, UpdateOrderDTO } from '../../models/Order';
import { OrderStatus, PaymentStatus } from '../../types';

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

    await auditService.recordAction({
      userEmail: req.user?.user || 'desconocido',
      action: 'eliminar',
      entity: 'orders',
      entityId: req.params.id,
      details: { softDelete: true }
    });

    res.status(204).send();
  } catch (err) { next(err); }
}

export async function updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.updateOrderStatus(
      req.params.id,
      req.body
    );

    await auditService.recordAction({
      userEmail: req.user?.user || 'desconocido',
      action: 'editar',
      entity: 'orders',
      entityId: order.id,
      details: { status: req.body.status }
    });

    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await ordersService.bulkUpdateOrderStatus(req.body);

    await auditService.recordAction({
      userEmail: req.user?.user || 'desconocido',
      action: 'editar',
      entity: 'orders',
      details: { action: req.body.action, totalAffected: result.success }
    });

    sendSuccess(res, result, 200, 'Actualización masiva completada');
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

    await auditService.recordAction({
      userEmail: req.user?.user || 'desconocido',
      action: 'editar',
      entity: 'orders',
      entityId: order.id,
      details: { paymentStatus: req.body.paymentStatus }
    });

    sendSuccess(res, order, 200, 'Estado de pago actualizado');
  } catch (error) {
    next(error);
  }
}

export async function exportPdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, paymentStatus, q, title } = req.query as Record<string, string | undefined>;

    const result = await ordersService.getAllOrders({
      status: status as OrderStatus | undefined,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      q,
      page: '1',
      limit: '500',
    });

    const orders: OrderPdfInput[] = result.data.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      customerFirstName: o.customer.firstName,
      customerLastName: o.customer.lastName,
      customerEmail: o.customer.email,
      total: Number(o.total),
      status: o.status,
      paymentStatus: o.paymentStatus ?? 'unpaid',
      items: (o.items ?? []).map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
      })),
    }));

    const { buffer, fileName } = await generateOrdersPdf({
      orders,
      title: title ?? 'Reporte de Pedidos',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.status(200).send(buffer);
  } catch (err) {
    next(err);
  }
}