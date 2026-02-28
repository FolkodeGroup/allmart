/**
 * services/publicOrderService.ts
 * Lógica para creación pública de pedidos usando Prisma Client con transacciones.
 */

import { prisma } from '../config/prisma';
import { CreatePublicOrderDTO, OrderStatus, PaymentStatus } from '../types';
import { createError } from '../middlewares/errorHandler';

export async function createPublicOrder(data: CreatePublicOrderDTO): Promise<string> {
  const { customer, items, total, notes } = data;

  // ─── Validaciones de negocio ──────────────────────────────────────────────
  if (!customer?.firstName || !customer?.lastName || !customer?.email) {
    throw createError('Datos del cliente incompletos', 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    throw createError('Email inválido', 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw createError('El pedido debe tener al menos un item', 400);
  }

  for (const item of items) {
    if (!item.productId || item.quantity <= 0 || item.unitPrice <= 0) {
      throw createError('Item inválido en el pedido', 400);
    }
  }

  if (!total || total <= 0) {
    throw createError('Total inválido', 400);
  }

  // ─── Transacción Prisma ───────────────────────────────────────────────────
  const result = await prisma.$transaction(async (tx) => {
    // 1. Crear el pedido
    const order = await tx.order.create({
      data: {
        customerFirstName:  customer.firstName,
        customerLastName:   customer.lastName,
        customerEmail:      customer.email,
        total,
        notes:              notes ?? null,
        status:             'pendiente' as Parameters<typeof tx.order.create>[0]['data']['status'],
        paymentStatus:      'no_abonado' as Parameters<typeof tx.order.create>[0]['data']['paymentStatus'],
      },
    });

    // 2. Crear los items del pedido
    await tx.orderItem.createMany({
      data: items.map((item) => ({
        orderId:      order.id,
        productId:    item.productId,
        productName:  item.productName,
        productImage: item.productImage ?? null,
        quantity:     item.quantity,
        unitPrice:    item.unitPrice,
      })),
    });

    // 3. Registrar el historial de estado inicial
    // (El trigger en BD también lo hace, pero lo hacemos explícito para Prisma)
    await tx.orderStatusHistory.create({
      data: {
        orderId:   order.id,
        status:    'pendiente' as Parameters<typeof tx.orderStatusHistory.create>[0]['data']['status'],
        note:      'Pedido creado: estado inicial set',
      },
    });

    return order.id;
  });

  return result;
}
