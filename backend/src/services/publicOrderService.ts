/**
 * services/publicOrderService.ts
 * Lógica para creación pública de pedidos con CRM Unificado y Stock Atómico.
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

  // 1. Ejecución de la transacción de Base de Datos
  const result = await prisma.$transaction(async (tx) => {
    
    // CRM UNIFICADO: Upsert del Usuario basado en Email (Invitado sin password)
    const userRecord = await tx.user.upsert({
      where: { email: normalizedEmail },
      update: {
        firstName: customer.firstName.trim(),
        lastName: customer.lastName.trim(),
        phone: normalizedPhone,
        totalOrders: { increment: 1 },
        totalSpent: { increment: total }
      },
      create: {
        email: normalizedEmail,
        firstName: customer.firstName.trim(),
        lastName: customer.lastName.trim(),
        phone: normalizedPhone,
        role: 'customer',
        passwordHash: null, 
        totalOrders: 1,
        totalSpent: total
      }
    });

    // Crear la Orden vinculada al nuevo userId único
    const order = await tx.order.create({
      data: {
        userId: userRecord.id,
        customerFirstName: customer.firstName.trim(),
        customerLastName: customer.lastName.trim(),
        customerEmail: normalizedEmail,
        customerPhone: normalizedPhone,
        total,
        notes: notes ?? null,
        status: 'pendiente',
        paymentStatus: 'no_abonado',
      },
    });

    // Gestión de Stock Atómico y creación de items
    for (const item of items) {
      const [realProductId] = item.productId.split('::');

      const updatedProduct = await tx.product.update({
        where: { id: realProductId },
        data: { stock: { decrement: item.quantity } }
      });

      if (updatedProduct.stock < 0) {
        throw createError(`Stock insuficiente para ${item.productName}`, 409);
      }

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: realProductId,
          productName: item.productName,
          productImage: item.productImage ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }
      });

      if (updatedProduct.stock <= 5) {
        await tx.lowStockAlert.create({
          data: {
            orderId: order.id,
            productId: realProductId,
            productName: item.productName,
            quantitySold: item.quantity,
            stockBefore: updatedProduct.stock + item.quantity,
            stockAfter: updatedProduct.stock,
          },
        });
      }
    }

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: 'pendiente', note: 'Pedido recibido vía Web' },
    });

    return {
      id: order.id,
      createdAt: order.createdAt,
    };
  });

  // 2. Acciones fuera de la transacción (Envío de Email)
  // Aquí usamos 'sendOrderConfirmationEmail' resolviendo el aviso de ESLint
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
    // Logueamos pero no fallamos la petición porque el pedido ya se guardó en BD
    console.error('[Orders] Error al enviar email de confirmación:', error);
  }

  return result.id;
}