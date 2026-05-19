/**
 * services/publicOrderService.ts
 * Lógica para creación pública de pedidos usando Prisma Client con transacciones.
 */

import { prisma } from '../config/prisma';
import { CreatePublicOrderDTO } from '../types';
import { createError } from '../middlewares/errorHandler';
import { sendOrderConfirmationEmail } from './orderConfirmationEmailService';

export async function createPublicOrder(data: CreatePublicOrderDTO): Promise<string> {
  const { customer, items, total, notes } = data;
  const normalizedPhone = customer?.phone?.trim();

  if (!customer?.firstName || !customer?.lastName || !customer?.email || !normalizedPhone) {
    throw createError('Datos del cliente incompletos', 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    throw createError('Email inválido', 400);
  }

  const phoneDigits = normalizedPhone.replace(/\D/g, '');
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    throw createError('Celular inválido', 400);
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

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerEmail: customer.email,
        customerPhone: normalizedPhone,
        total,
        notes: notes ?? null,
        status: 'pendiente' as Parameters<typeof tx.order.create>[0]['data']['status'],
        paymentStatus: 'no_abonado' as Parameters<typeof tx.order.create>[0]['data']['paymentStatus'],
      },
    });

    await tx.orderItem.createMany({
      data: items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stock: true },
      });

      if (product) {
        const stockBefore = product.stock;
        const stockAfter = stockBefore - item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { stock: stockAfter },
        });

        if (stockAfter <= 0) {
          await tx.lowStockAlert.create({
            data: {
              orderId: order.id,
              productId: product.id,
              productName: product.name,
              quantitySold: item.quantity,
              stockBefore,
              stockAfter,
            },
          });
        }
      }
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'pendiente' as Parameters<typeof tx.orderStatusHistory.create>[0]['data']['status'],
        note: 'Pedido creado: estado inicial set',
      },
    });

    return {
      id: order.id,
      createdAt: order.createdAt,
    };
  });

  try {
    await sendOrderConfirmationEmail({
      orderId: result.id,
      createdAt: result.createdAt,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: normalizedPhone,
      },
      items: items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      total,
      notes,
    });
  } catch (error) {
    console.error('[Orders] No se pudo enviar el email de confirmación:', error);
  }

  return result.id;
}
