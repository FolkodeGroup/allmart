/**
 * services/ordersService.ts
 * Lógica de negocio para el dominio de pedidos usando Prisma Client.
 */
import { prisma } from '../config/prisma';
import { Order, CreateOrderDTO, UpdateOrderDTO } from '../models/Order';
import { OrderStatus, PaymentStatus } from '../types';
import { createError } from '../middlewares/errorHandler';
import { PaginatedResponseDTO } from '../types/admin/pagination';
import { AdminOrdersQueryDTO } from '../types/admin/order';
import { AdminOrderDTO } from '../types/admin/order';

// ─── Conversiones de enums Prisma ↔ aplicación ────────────────────────────────
// Prisma genera enum keys con underscore (en_preparacion, no_abonado)
// para cumplir con las restricciones de identificadores TypeScript.
// En la BD y en la API se usa la versión con guión (en-preparacion, no-abonado).

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

// Convierte OrderStatus de la app al enum Prisma (para escritura)
function orderStatusToPrismaStatus(s: OrderStatus): string {
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

function paymentStatusToPrismaStatus(s: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    [PaymentStatus.UNPAID]: 'no_abonado',
    [PaymentStatus.PAID]:   'abonado',
  };
  return map[s] ?? s;
}

// Mapea Prisma Order al tipo Order de la app
function toOrder(row: any): Order {
  return {
    id: row.id,
    customer: {
      firstName: row.customerFirstName || row.customer_first_name,
      lastName: row.customerLastName || row.customer_last_name,
      email: row.customerEmail || row.customer_email,
    },
    total: typeof row.total === 'object' && row.total.toNumber ? row.total.toNumber() : Number(row.total),
    status: prismaStatusToOrderStatus(row.status),
    paymentStatus: prismaPaymentToPaymentStatus(row.paymentStatus || row.payment_status),
    paidAt: row.paidAt || row.paid_at || undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
  };
}


export async function getAllOrders(
  query: AdminOrdersQueryDTO
): Promise<PaginatedResponseDTO<Order>> {

  const {
    status,
    paymentStatus,
    q,
    page = 1,
    limit = 10
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const where: any = {};

  if (status) {
    where.status = orderStatusToPrismaStatus(status);
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatusToPrismaStatus(paymentStatus);
  }

  if (q) {
    where.OR = [
      { customerFirstName: { contains: q, mode: 'insensitive' } },
      { customerLastName:  { contains: q, mode: 'insensitive' } },
      { customerEmail:     { contains: q, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  return {
<<<<<<< Updated upstream
    data: dataResult.rows.map(toOrder),
=======
    data: rows.map(toOrder),
>>>>>>> Stashed changes
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber)
  };
}

export async function getOrderById(
  id: string
): Promise<AdminOrderDTO> {

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: {
        orderBy: { changedAt: 'asc' }
      }
    }
  });

  if (!order) {
    throw createError('Pedido no encontrado', 404);
  }

<<<<<<< Updated upstream
  const order = toOrder(orderResult.rows[0]);

  const itemsResult = await prisma.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [id]
  );

  const historyResult = await prisma.query(
    'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY changed_at ASC',
    [id]
  );

  return {
    ...order,
    items: itemsResult.rows.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.product_image,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity
    })),
    statusHistory: historyResult.rows.map(h => ({
      status: prismaStatusToOrderStatus(h.status),
      changedAt: h.changed_at
    }))
=======
  return {
    ...toOrder(order),
    items: order.items,
    statusHistory: order.statusHistory
>>>>>>> Stashed changes
  };
}

export async function createOrder(dto: CreateOrderDTO): Promise<Order> {
  const row = await prisma.order.create({
    data: {
      customerFirstName: dto.customer.firstName,
      customerLastName:  dto.customer.lastName,
      customerEmail:     dto.customer.email,
      total:             dto.total,
      notes:             dto.notes ?? null,
      status:            orderStatusToPrismaStatus(OrderStatus.PENDING) as Parameters<typeof prisma.order.create>[0]['data']['status'],
      paymentStatus:     paymentStatusToPrismaStatus(PaymentStatus.UNPAID) as Parameters<typeof prisma.order.create>[0]['data']['paymentStatus'],
    },
  });
  return toOrder(row);
}

export async function updateOrder(id: string, dto: UpdateOrderDTO): Promise<Order> {
  await getOrderById(id); // valida existencia

  const data: Record<string, unknown> = {};
  if (dto.status !== undefined)        data.status        = orderStatusToPrismaStatus(dto.status);
  if (dto.paymentStatus !== undefined) data.paymentStatus = paymentStatusToPrismaStatus(dto.paymentStatus);
  if (dto.paidAt !== undefined)        data.paidAt        = dto.paidAt;
  if (dto.notes !== undefined)         data.notes         = dto.notes;

  const row = await prisma.order.update({
    where: { id },
    data: data as Parameters<typeof prisma.order.update>[0]['data'],
  });
  return toOrder(row);
}

export async function updateOrderStatus(
  id: string,
  dto: { status: OrderStatus; note?: string }
): Promise<AdminOrderDTO> {

  if (!dto.status) {
    throw createError('Status es requerido', 400);
  }

  if (!Object.values(OrderStatus).includes(dto.status)) {
    throw createError('Estado inválido', 400);
  }

  return prisma.$transaction(async (tx) => {

    const order = await tx.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: true
      }
    });

    if (!order) {
      throw createError('Pedido no encontrado', 404);
    }

    const newStatus = orderStatusToPrismaStatus(dto.status);

    // 🔹 Actualiza estado
    await tx.order.update({
      where: { id },
      data: { status: newStatus }
    });

    // 🔹 Registra historial
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status: newStatus,
        note: dto.note ?? null
      }
    });

    // 🔹 Si es entregado, registrar venta
    if (dto.status === OrderStatus.DELIVERED) {
      await tx.sale.create({
        data: {
          orderId: id,
          total: order.total,
          createdAt: new Date()
        }
      });
    }

    // 🔹 Devuelve pedido actualizado con historial completo
    const updatedOrder = await tx.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: {
          orderBy: { changedAt: 'asc' }
        }
      }
    });

    if (!updatedOrder) {
      throw createError('Error recuperando pedido actualizado', 500);
    }

    return {
      ...toOrder(updatedOrder),
      items: updatedOrder.items,
      statusHistory: updatedOrder.statusHistory
    };
  });
}

export async function deleteOrder(id: string): Promise<void> {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw createError('Pedido no encontrado', 404);
  await prisma.order.delete({ where: { id } });
}

