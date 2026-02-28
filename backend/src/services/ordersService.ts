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
function toOrder(row: {
  id: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  total: import('@prisma/client/runtime/client').Decimal;
  status: string;
  paymentStatus: string;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Order {
  return {
    id: row.id,
    customerFirstName: row.customerFirstName,
    customerLastName: row.customerLastName,
    customerEmail: row.customerEmail,
    total: row.total.toNumber(),
    status: prismaStatusToOrderStatus(row.status),
    paymentStatus: prismaPaymentToPaymentStatus(row.paymentStatus),
    paidAt: row.paidAt ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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
  const offset = (pageNumber - 1) * limitNumber;

  let baseSql = 'FROM orders WHERE 1=1';
  const params: any[] = [];

  if (status) {
    params.push(status);
    baseSql += ` AND status = $${params.length}`;
  }

  if (paymentStatus) {
    params.push(paymentStatus);
    baseSql += ` AND payment_status = $${params.length}`;
  }

  if (q) {
    params.push(`%${q}%`);
    baseSql += ` AND (
      customer_first_name ILIKE $${params.length}
      OR customer_last_name ILIKE $${params.length}
      OR customer_email ILIKE $${params.length}
    )`;
  }

  // 🔹 Query de datos paginados
  const dataSql = `
    SELECT *
    ${baseSql}
    ORDER BY created_at DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;

  const dataParams = [...params, limitNumber, offset];

  const dataResult = await prisma.query(dataSql, dataParams);

  // 🔹 Query para total
  const countSql = `SELECT COUNT(*) ${baseSql}`;
  const countResult = await prisma.query(countSql, params);

  const total = Number(countResult.rows[0].count);

  return {
    data: dataResult.rows,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber)
  };
}

export async function getOrderById(
  id: string
): Promise<AdminOrderDTO> {

  const orderResult = await prisma.query(
    'SELECT * FROM orders WHERE id = $1',
    [id]
  );

  if (orderResult.rowCount === 0) {
    throw createError('Pedido no encontrado', 404);
  }

  const order = orderResult.rows[0];

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
    items: itemsResult.rows,
    statusHistory: historyResult.rows
  };
}

export async function createOrder(dto: CreateOrderDTO): Promise<Order> {
  const row = await prisma.order.create({
    data: {
      customerFirstName: dto.customerFirstName,
      customerLastName:  dto.customerLastName,
      customerEmail:     dto.customerEmail,
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

export async function deleteOrder(id: string): Promise<void> {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw createError('Pedido no encontrado', 404);
  await prisma.order.delete({ where: { id } });
}

