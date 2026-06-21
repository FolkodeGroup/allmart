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
    // Validar que todos los productos existan antes de crear la orden
    const validatedItems = [];
    for (const item of items) {
        // Normalizar y validar productId para evitar llamadas inválidas a Prisma
        const rawProductId = (item as any).productId;
        if (rawProductId === undefined || rawProductId === null || rawProductId === '') {
          throw createError(`Producto con ID ${rawProductId} inválido`, 400);
        }

        let normalizedProductId = typeof rawProductId === 'string' ? rawProductId : String(rawProductId);

        // If frontend appended a suffix like `::original` or `::<skuId>`, keep only the real product id (UUID)
        if (typeof normalizedProductId === 'string' && normalizedProductId.includes('::')) {
          normalizedProductId = normalizedProductId.split('::')[0];
        }

        let product;
        try {
          product = await tx.product.findUnique({
            where: { id: normalizedProductId },
            select: { id: true, name: true, stock: true },
          });
        } catch (err) {
          // Prisma throws informative errors for invalid args (e.g. wrong type)
          throw createError(`Error buscando el producto con ID ${normalizedProductId}`, 400);
        }

        if (!product) {
          throw createError(`Producto con ID ${normalizedProductId} no encontrado`, 404);
        }

        // Store normalized productId so downstream writes use the correct UUID
        validatedItems.push({ ...item, product, productId: normalizedProductId });
    }

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
      data: validatedItems.map((item) => ({
        orderId: order.id,
        productId: (item as any).productId,
        productName: item.productName ?? item.product?.name,
        productImage: item.productImage ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    for (const item of validatedItems) {
      const product = item.product;
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
