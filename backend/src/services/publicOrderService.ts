/**
 * services/publicOrderService.ts
 * Lógica para creación pública de pedidos usando Prisma Client con transacciones.
 * Implementa Guest Checkout con CRM Implícito (Upsert de Customer).
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
  const normalizedEmail = customer.email.trim().toLowerCase();
  
  if (!emailRegex.test(normalizedEmail)) {
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

  // Ejecución Atómica (Todo o Nada)
  const result = await prisma.$transaction(async (tx) => {
    
    // 1. Validar existencia y stock de productos
    const validatedItems = [];
    for (const item of items) {
      const [realProductId] = item.productId.split('::');

      const product = await tx.product.findUnique({
        where: { id: realProductId },
        select: { id: true, name: true, stock: true },
      });

      if (!product) {
        throw createError(`Producto con ID ${realProductId} no encontrado`, 404);
      }

      validatedItems.push({ 
        ...item, 
        realProductId,
        product 
      });
    }

    // 2. CRM IMPLÍCITO: Upsert del Customer basado en Email Natural Key
    const customerRecord = await tx.customer.upsert({
      where: { email: normalizedEmail },
      update: {
        // Actualizamos con los últimos datos proporcionados por el cliente
        firstName: customer.firstName.trim(),
        lastName: customer.lastName.trim(),
        phone: normalizedPhone,
        // Incrementamos métricas analíticas
        totalOrders: { increment: 1 },
        totalSpent: { increment: total }
      },
      create: {
        email: normalizedEmail,
        firstName: customer.firstName.trim(),
        lastName: customer.lastName.trim(),
        phone: normalizedPhone,
        totalOrders: 1,
        totalSpent: total
      }
    });

    // 3. Crear Orden: Vínculo fuerte (customerId) + Snapshot inmutable de datos
    const order = await tx.order.create({
      data: {
        customerId: customerRecord.id, // Vínculo relacional
        // Snapshot
        customerFirstName: customer.firstName.trim(),
        customerLastName: customer.lastName.trim(),
        customerEmail: normalizedEmail,
        customerPhone: normalizedPhone,
        total,
        notes: notes ?? null,
        status: 'pendiente' as Parameters<typeof tx.order.create>[0]['data']['status'],
        paymentStatus: 'no_abonado' as Parameters<typeof tx.order.create>[0]['data']['paymentStatus'],
      },
    });

    // 4. Crear Items de la orden
    await tx.orderItem.createMany({
      data: validatedItems.map((item) => ({
        orderId: order.id,
        productId: item.realProductId,
        productName: item.productName,
        productImage: item.productImage ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    // 5. Gestión de Stock
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

    // 6. Historial de estados
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'pendiente' as Parameters<typeof tx.orderStatusHistory.create>[0]['data']['status'],
        note: 'Pedido creado (Guest Checkout)',
      },
    });

    return {
      id: order.id,
      createdAt: order.createdAt,
    };
  });

  // 7. Acciones Asíncronas (Fuera de la transacción de base de datos)
  try {
    await sendOrderConfirmationEmail({
      orderId: result.id,
      createdAt: result.createdAt,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: normalizedEmail,
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