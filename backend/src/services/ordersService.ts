/**
 * services/ordersService.ts
 * Lógica de negocio para el dominio de pedidos usando el esquema CRM unificado.
 */
import { prisma } from '../config/prisma';
import { Order, CreateOrderDTO, UpdateOrderDTO } from '../models/Order';
import { OrderStatus, PaymentStatus } from '../types';
import { createError } from '../middlewares/errorHandler';
import { PaginatedResponseDTO } from '../types/admin/pagination';
import { AdminOrdersQueryDTO } from '../types/admin/order';
import { AdminOrderDTO } from '../types/admin/order';
import {
  AdminBulkUpdateOrderStatusDTO,
  AdminBulkUpdateOrderStatusResultDTO,
  AdminBulkOrderAction,
  AdminBulkUpdateOrderStatusItemResultDTO,
} from '../types/admin/order';

// ─── Helpers de Conversión ──────────────────────────────────────────────────

function prismaStatusToOrderStatus(s: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    pendiente:        OrderStatus.PENDING,
    confirmado:       OrderStatus.CONFIRMED,
    en_preparacion:   OrderStatus.PROCESSING,
    enviado:          OrderStatus.SHIPPED,
    entregado:        OrderStatus.DELIVERED,
    cancelado:        OrderStatus.CANCELLED,
  };
  return map[s] ?? (s as OrderStatus);
}

function prismaPaymentToPaymentStatus(s: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    no_abonado: PaymentStatus.UNPAID,
    abonado:    PaymentStatus.PAID,
  };
  return map[s] ?? (s as PaymentStatus);
}

function orderStatusToPrismaStatus(s: OrderStatus): any {
  const map: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]:    'pendiente',
    [OrderStatus.CONFIRMED]:  'confirmado',
    [OrderStatus.PROCESSING]: 'en_preparacion',
    [OrderStatus.SHIPPED]:    'enviado',
    [OrderStatus.DELIVERED]:  'entregado',
    [OrderStatus.CANCELLED]:  'cancelado',
  };
  return map[s] ?? s;
}

function paymentStatusToPrismaStatus(s: PaymentStatus): any {
  const map: Record<PaymentStatus, string> = {
    [PaymentStatus.UNPAID]: 'no_abonado',
    [PaymentStatus.PAID]:   'abonado',
  };
  return map[s] ?? s;
}

function canApplyBulkAction(action: AdminBulkOrderAction, currentStatus: OrderStatus): boolean {
  if (action === 'confirm') return currentStatus === OrderStatus.PENDING;
  if (action === 'ship') {
    return currentStatus === OrderStatus.CONFIRMED || currentStatus === OrderStatus.PROCESSING;
  }
  if (action === 'cancel') {
    return currentStatus !== OrderStatus.SHIPPED
      && currentStatus !== OrderStatus.DELIVERED
      && currentStatus !== OrderStatus.CANCELLED;
  }
  return false;
}

function bulkActionToTargetStatus(action: AdminBulkOrderAction): OrderStatus {
  if (action === 'confirm') return OrderStatus.CONFIRMED;
  if (action === 'ship') return OrderStatus.SHIPPED;
  return OrderStatus.CANCELLED;
}

function toOrder(row: any): Order {
  return {
    id: row.id,
    customerId: row.userId, // Referencia al ID único del CRM (User)
    customer: {
      firstName: row.customerFirstName,
      lastName: row.customerLastName,
      email: row.customerEmail,
      phone: row.customerPhone || undefined,
    },
    total: typeof row.total === 'object' && row.total.toNumber ? row.total.toNumber() : Number(row.total),
    status: prismaStatusToOrderStatus(row.status),
    paymentStatus: prismaPaymentToPaymentStatus(row.paymentStatus),
    paidAt: row.paidAt || undefined,
    notes: row.notes ?? undefined,
    items: Array.isArray(row.orderItems)
      ? row.orderItems.map((item: any) => ({
        productId: item.productId || '',
        productName: item.productName,
        productImage: item.productImage || undefined,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
      }))
      : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Servicios ─────────────────────────────────────────────────────────────

export async function getAllOrders(query: AdminOrdersQueryDTO): Promise<PaginatedResponseDTO<Order>> {
  const { status, paymentStatus, q, page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (status) where.status = orderStatusToPrismaStatus(status);
  if (paymentStatus) where.paymentStatus = paymentStatusToPrismaStatus(paymentStatus);
  if (q) {
    where.OR = [
      { customerFirstName: { contains: q, mode: 'insensitive' } },
      { customerLastName:  { contains: q, mode: 'insensitive' } },
      { customerEmail:     { contains: q, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: Number(limit),
      include: { orderItems: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  return {
    data: rows.map(toOrder),
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit))
  };
}

export async function getOrderById(id: string): Promise<AdminOrderDTO> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: true,
      orderStatusHistory: { orderBy: { changedAt: 'asc' } }
    }
  });

  if (!order) throw createError('Pedido no encontrado', 404);

  return {
    ...toOrder(order),
    items: order.orderItems.map(item => ({
      productId: item.productId || '',
      productName: item.productName,
      productImage: item.productImage || undefined,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity
    })),
    statusHistory: order.orderStatusHistory.map(h => ({
      status: prismaStatusToOrderStatus(h.status),
      changedAt: h.changedAt
    }))
  };
}

export async function updateOrderStatus(id: string, dto: { status: OrderStatus; note?: string }): Promise<AdminOrderDTO> {
  if (!Object.values(OrderStatus).includes(dto.status)) throw createError('Estado inválido', 400);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw createError('Pedido no encontrado', 404);

    const newStatus = orderStatusToPrismaStatus(dto.status);

    await tx.order.update({
      where: { id },
      data: { status: newStatus }
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status: newStatus,
        note: dto.note ?? null
      }
    });

    return getOrderById(id);
  });
}

export async function updateOrderPaymentStatus(id: string, dto: { paymentStatus: PaymentStatus }): Promise<Order> {
  const newPaymentStatus = paymentStatusToPrismaStatus(dto.paymentStatus);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      paymentStatus: newPaymentStatus,
      paidAt: dto.paymentStatus === PaymentStatus.PAID ? new Date() : null
    }
  });

  return toOrder(updated);
}

export async function deleteOrder(id: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw createError('Pedido no encontrado', 404);
  await prisma.order.delete({ where: { id } });
}

export async function bulkUpdateOrderStatus(dto: AdminBulkUpdateOrderStatusDTO): Promise<AdminBulkUpdateOrderStatusResultDTO> {
  const { orderIds, action, note } = dto;
  const targetStatus = bulkActionToTargetStatus(action);
  const targetPrismaStatus = orderStatusToPrismaStatus(targetStatus);

  const results = await prisma.$transaction(async (tx) => {
    const rows = await tx.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, status: true },
    });

    const itemResults: AdminBulkUpdateOrderStatusItemResultDTO[] = [];

    for (const orderId of orderIds) {
      const row = rows.find(r => r.id === orderId);
      if (!row) {
        itemResults.push({ id: orderId, success: false, reason: 'No encontrado' });
        continue;
      }

      if (!canApplyBulkAction(action, prismaStatusToOrderStatus(row.status))) {
        itemResults.push({ id: orderId, success: false, reason: 'Transición no permitida' });
        continue;
      }

      await tx.order.update({ where: { id: orderId }, data: { status: targetPrismaStatus } });
      await tx.orderStatusHistory.create({ data: { orderId, status: targetPrismaStatus, note: note ?? null } });
      itemResults.push({ id: orderId, success: true });
    }

    return itemResults;
  });

  return {
    action,
    targetStatus,
    total: results.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}

export async function createOrder(dto: CreateOrderDTO): Promise<Order> {
    const row = await prisma.order.create({
      data: {
        customerFirstName: dto.customer.firstName,
        customerLastName:  dto.customer.lastName,
        customerEmail:     dto.customer.email,
        customerPhone:     dto.customer.phone ?? null,
        total:             dto.total,
        notes:             dto.notes ?? null,
        status:            'pendiente',
        paymentStatus:     'no_abonado',
      },
    });
    return toOrder(row);
}

export async function updateOrder(id: string, dto: UpdateOrderDTO): Promise<Order> {
    const data: any = {};
    if (dto.status) data.status = orderStatusToPrismaStatus(dto.status);
    if (dto.paymentStatus) data.paymentStatus = paymentStatusToPrismaStatus(dto.paymentStatus);
    if (dto.paidAt) data.paidAt = dto.paidAt;
    if (dto.notes) data.notes = dto.notes;
  
    const row = await prisma.order.update({
      where: { id },
      data,
    });
    return toOrder(row);
}