/**
 * services/ordersService.ts
 * Lógica de negocio para el dominio de pedidos.
 */

import { v4 as uuidv4 } from 'uuid';
import { Order, CreateOrderDTO, UpdateOrderDTO } from '../models/Order';
import { OrderStatus } from '../types';
import { createError } from '../middlewares/errorHandler';

const store: Map<string, Order> = new Map();

export async function getAllOrders(): Promise<Order[]> {
  return Array.from(store.values());
}

export async function getOrderById(id: string): Promise<Order> {
  const order = store.get(id);
  if (!order) throw createError('Pedido no encontrado', 404);
  return order;
}

export async function createOrder(dto: CreateOrderDTO): Promise<Order> {
  const now = new Date();
  const order: Order = {
    ...dto,
    id: uuidv4(),
    status: OrderStatus.PENDING,
    createdAt: now,
    updatedAt: now,
  };
  store.set(order.id, order);
  return order;
}

export async function updateOrder(id: string, dto: UpdateOrderDTO): Promise<Order> {
  const existing = await getOrderById(id);
  const updated: Order = { ...existing, ...dto, updatedAt: new Date() };
  store.set(id, updated);
  return updated;
}

export async function deleteOrder(id: string): Promise<void> {
  if (!store.has(id)) throw createError('Pedido no encontrado', 404);
  store.delete(id);
}
