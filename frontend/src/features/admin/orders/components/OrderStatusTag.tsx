// ─────────────────────────────────────────────────────────────────────────────
// OrderStatusTag.tsx
// Badge visual compacto para estados problemáticos (cancelado / pendiente).
// Usado en la vista de lista mobile y en la tabla de pedidos.
//
// DIFERENCIA con OrderStatusBadge:
//  - OrderStatusTag: solo resalta visualmente "cancelado" y "pendiente" con
//    iconos y bordes de alerta. El resto de estados se muestra sin énfasis.
//  - OrderStatusBadge: muestra todos los estados con colores de fondo por estado.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import styles from '../AdminOrders.module.css';
import type { OrderStatus } from '../ordersService';

interface Props {
  /** Estado actual del pedido. Determina el estilo visual del tag. */
  status: OrderStatus;
}

/**
 * OrderStatusTag — indicador visual compacto de estado.
 *
 * Lógica de estilos:
 *  - 'cancelado'  → borde rojo + icono ⚠️  (statusDanger)
 *  - 'pendiente'  → borde amarillo + icono ⏳ (statusWarning)
 *  - resto        → estilo base neutro sin icono (statusTag)
 *
 * El texto del estado se capitaliza con charAt(0).toUpperCase() en lugar de
 * usar CSS text-transform, para que funcione correctamente en todos los browsers.
 */

export const OrderStatusTag: React.FC<Props> = ({ status }) => {
  let indicator = null;
  let className = styles.statusTag;

  if (status === 'cancelado') {
    indicator = <span className={styles.statusDangerIcon} title="Cancelado">⚠️</span>;
    className += ' ' + styles.statusDanger;
  } else if (status === 'pendiente') {
    indicator = <span className={styles.statusWarningIcon} title="Pendiente de pago">⏳</span>;
    className += ' ' + styles.statusWarning;
  }

  // Los demás estados (confirmado, en-preparacion, enviado, entregado) no
  // tienen indicador especial: se muestran con el estilo base neutral.

  return (
    <span className={className}>
      {indicator}
      <span className={styles.statusTagText}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </span>
  );
};

export default OrderStatusTag;
