/**
 * services/publicOrderService.ts
 * Lógica para creación pública de pedidos usando Prisma Client con transacciones.
 */

import { prisma } from '../config/prisma';
import { CreatePublicOrderDTO } from '../types';
import { createError } from '../middlewares/errorHandler';
import { sendOrderConfirmationEmail } from './orderConfirmationEmailService';
import { stripSuffixId, looksLikeUuid } from '../utils/normalizeId';

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
    // Validar que todos los productos/variantes existan antes de crear la orden
    const validatedItems: Array<any> = [];
    for (const item of items) {
      // Normalizar ids que pueden venir con sufijos (p.ej. productId::skuId o productId::original)
      const rawId = String(item.productId);
      const stripped = stripSuffixId(rawId);

      // Si parece UUID, intentar buscar primero un SKU (variant) por id
      if (looksLikeUuid(stripped)) {
        const sku = await tx.productSku.findUnique({ where: { id: stripped }, select: { id: true, productId: true, stock: true, price: true } as any }) as any;
        if (sku) {
          const parent = await tx.product.findUnique({ where: { id: sku.productId }, select: { id: true, name: true, stock: true } });
          if (!parent) {
            throw createError(`Producto padre de la variante ${rawId} no encontrado`, 404);
          }
          item.unitPrice = item.unitPrice ?? (sku.price ? Number(sku.price) : item.unitPrice);
          validatedItems.push({ ...item, product: parent, resolvedProductId: parent.id });
        } else {
          const product = await tx.product.findUnique({ where: { id: stripped }, select: { id: true, name: true, stock: true } });
          if (!product) {
            throw createError(`Producto con ID ${rawId} no encontrado`, 404);
          }
          validatedItems.push({ ...item, product, resolvedProductId: product.id });
        }
      } else {
        // No parece UUID: intentar buscar por sku code o por slug
        const skuByCode = await tx.productSku.findFirst({ where: { sku: stripped }, select: { id: true, productId: true, stock: true, price: true } as any }) as any;
        if (skuByCode) {
          const parent = await tx.product.findUnique({ where: { id: skuByCode.productId }, select: { id: true, name: true, stock: true } });
          if (!parent) throw createError(`Producto padre de la variante ${rawId} no encontrado`, 404);
          item.unitPrice = item.unitPrice ?? (skuByCode.price ? Number(skuByCode.price) : item.unitPrice);
          validatedItems.push({ ...item, product: parent, resolvedProductId: parent.id });
        } else {
          const productBySlug = await tx.product.findFirst({ where: { slug: stripped }, select: { id: true, name: true, stock: true } });
          if (!productBySlug) {
            throw createError(`Producto con identificador ${rawId} no encontrado`, 404);
          }
          validatedItems.push({ ...item, product: productBySlug, resolvedProductId: productBySlug.id });
        }
      }
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
        // usar el productId resuelto (id del producto padre) para la FK en order_items
        productId: item.resolvedProductId ?? stripSuffixId(String(item.productId)),
        productName: item.productName,
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
