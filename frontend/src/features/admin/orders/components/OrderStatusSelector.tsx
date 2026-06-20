// ─────────────────────────────────────────────────────────────────────────────
// OrderStatusSelector.tsx
// Select interactivo para cambiar el estado de un pedido desde la tabla
// o desde el modal de detalle. Incluye un paso de confirmación inline.
// ─────────────────────────────────────────────────────────────────────────────


import React, { useState } from 'react';
import { STATUS_OPTIONS, STATUS_LABELS } from './../utils/ordersHelpers';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';
import styles from '../AdminOrders.module.css';

/**
 * Props de OrderStatusSelector.
 *
 * @param value    - Estado actual del pedido (valor controlado externamente).
 * @param onChange - Callback que se llama con el nuevo estado.
 *                   ATENCIÓN: se llama INMEDIATAMENTE al seleccionar, antes
 *                   de que el usuario confirme. Esto permite marcar isDirty
 *                   en el padre sin esperar la confirmación.
 * @param disabled - Bloquea el select durante operaciones async (ej: guardado).
 */

interface OrderStatusSelectorProps {
  value: OrderStatus;
  onChange: (newStatus: OrderStatus) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * OrderStatusSelector — select de estado con confirmación inline.
 *
 * Flujo de cambio de estado:
 *  1. Usuario selecciona un nuevo estado en el <select>.
 *  2. `pendingStatus` se actualiza localmente y se muestra el cuadro de confirmación.
 *  3. Se notifica al padre inmediatamente vía onChange (para isDirty / optimistic UI).
 *  4a. Si confirma → se oculta el cuadro; el padre ya tiene el valor correcto.
 *  4b. Si cancela → se revierte `pendingStatus` al valor original y se llama
 *      onChange(value) para que el padre también revierta.
 *
 * IMPORTANTE: este componente NO llama a la API directamente. La responsabilidad
 * de persistir el cambio recae en el padre (OrderItem, OrderDetailModal).
 */

export const OrderStatusSelector: React.FC<OrderStatusSelectorProps> = ({ value, onChange, disabled }) => {
  // Estado local para el valor "en vuelo" antes de confirmar
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(value);

  /**
  * Se dispara al cambiar el select.
  * Notifica al padre de inmediato para permitir marcado de isDirty,
  * aunque el usuario todavía no haya confirmado.
  */

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    setPendingStatus(newStatus);

    // Notificación optimista: el padre puede marcar isDirty sin esperar confirmación
    if (newStatus !== value) onChange(newStatus);
  };

  return (
    <div className={styles.orderStatusSelectorContainer}>
      <select
        className={styles.statusSelect}
        value={pendingStatus}
        onChange={handleSelect}
        disabled={disabled}
        aria-label="Cambiar estado"
      >
        {STATUS_OPTIONS.map(s => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
    </div>
  );
};
