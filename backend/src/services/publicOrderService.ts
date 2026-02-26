/**
 * services/publicOrdersService.ts
 * Lógica para creación pública de pedidos (persistencia real en BD).
 */

import { pool } from '../config/db';
import { CreatePublicOrderDTO, OrderStatus, PaymentStatus } from "../types";
import { createError } from "../middlewares/errorHandler";

export async function createPublicOrder(
  data: CreatePublicOrderDTO
): Promise<number> {

  const connection = await pool.getConnection();

  try {
    const { customer, items, total, notes } = data;

    // ==========================
    // VALIDACIONES DE NEGOCIO
    // ==========================

    if (!customer?.firstName || !customer?.lastName || !customer?.email) {
      throw createError("Datos del cliente incompletos", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      throw createError("Email inválido", 400);
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw createError("El pedido debe tener al menos un item", 400);
    }

    if (!total || total <= 0) {
      throw createError("Total inválido", 400);
    }

    // ==========================
    // TRANSACCIÓN
    // ==========================

    await connection.beginTransaction();

    // ==========================
    // INSERT ORDER
    // ==========================

    const [orderResult]: any = await connection.query(
      `
      INSERT INTO orders
      (customer_first_name, customer_last_name, customer_email, total, status, payment_status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        customer.firstName,
        customer.lastName,
        customer.email,
        total,
        OrderStatus.PENDING,
        PaymentStatus.UNPAID,
        notes || null,
      ]
    );

    const orderId: number = orderResult.insertId;

    // ==========================
    // INSERT ITEMS
    // ==========================

    for (const item of items) {

      if (!item.productId || item.quantity <= 0 || item.unitPrice <= 0) {
        throw createError("Item inválido en el pedido", 400);
      }

      await connection.query(
        `
        INSERT INTO order_items
        (order_id, product_id, product_name, product_image, unit_price, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.productId,
          item.productName,
          item.productImage || null,
          item.unitPrice,
          item.quantity,
        ]
      );
    }

    // ==========================
    // INSERT STATUS HISTORY
    // ==========================

    await connection.query(
      `
      INSERT INTO order_status_history
      (order_id, status, created_at)
      VALUES (?, ?, NOW())
      `,
      [orderId, OrderStatus.PENDING]
    );

    await connection.commit();
    connection.release();

    return orderId;

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}