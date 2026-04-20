// ─────────────────────────────────────────────────────────────────────────────
// OrderStatusBadge.tsx
// Badge accesible de solo lectura para mostrar el estado actual de un pedido.
// Usado principalmente en el modal de detalle (OrderDetailModal).
//
// DIFERENCIA con OrderStatusTag:
//  - OrderStatusBadge: muestra todos los estados con colores de fondo distintos
//    y es completamente accesible (role="status", aria-live).
//  - OrderStatusTag: solo resalta visualmente "cancelado" y "pendiente"; diseño
//    más compacto para uso en tabla/lista.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { STATUS_LABELS, statusClass } from '../utils/ordersHelpers';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';
import styles from '../../orders/AdminOrders.module.css';

/**
 * Props de OrderStatusBadge.
 *
 * @param status    - Estado del pedido a mostrar.
 * @param className - Clase adicional opcional para ajustes de layout en el padre.
 */

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

/**
 * OrderStatusBadge — badge de estado accesible y de solo lectura.
 *
 * - `statusClass(status, styles)` resuelve la clase CSS correcta según el estado
 *   (definida en ordersHelpers.ts: statusPendiente, statusConfirmado, etc.).
 * - `aria-live="polite"` notifica a lectores de pantalla cuando el estado cambia
 *   sin interrumpir el flujo del usuario.
 * - `tabIndex={0}` permite enfocarlo con teclado para que el aria-label sea leído.
 *
 * @example
 * <OrderStatusBadge status="en-preparacion" />
 * // Renderiza: <span class="statusBadge statusPreparacion" ...>En preparación</span>
 */

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className }) => (
  <span
    className={`${styles.statusBadge} ${statusClass(status, styles)}${className ? ' ' + className : ''}`}
    aria-label={`Estado: ${STATUS_LABELS[status]}`}
    role="status"
    aria-live="polite"
  >
    {STATUS_LABELS[status]}
  </span>
);
