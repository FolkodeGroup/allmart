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
import { Badge } from '../../../../components/ui/Badge/Badge';
import { STATUS_LABELS } from '../utils/ordersHelpers';
import type { OrderStatus } from '../ordersService';

interface Props {
  /** Estado actual del pedido. Determina el estilo visual del tag. */
  status: OrderStatus;
}

const STATUS_VARIANTS: Record<OrderStatus, 'discount' | 'new' | 'outOfStock'> = {
  pendiente: 'discount',
  confirmado: 'new',
  'en-preparacion': 'new',
  enviado: 'new',
  entregado: 'new',
  cancelado: 'outOfStock',
};

export const OrderStatusTag: React.FC<Props> = ({ status }) => {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? 'new'}>
      {STATUS_LABELS[status]}
    </Badge>
  );
};

export default OrderStatusTag;
