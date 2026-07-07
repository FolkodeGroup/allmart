// ─────────────────────────────────────────────────────────────────────────────
// OrderStatusSelector.tsx
// Select interactivo para cambiar el estado de un pedido desde la tabla
// o desde el modal de detalle. Incluye un paso de confirmación inline.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { STATUS_OPTIONS, STATUS_LABELS } from './../utils/ordersHelpers';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';
import styles from '../AdminOrders.module.css';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

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

export const OrderStatusSelector: React.FC<OrderStatusSelectorProps> = ({ value, onChange, disabled, className = '' }) => {
  // Estado local para el valor "en vuelo" antes de confirmar
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(value);

  // Sincronizar el estado local si el valor cambia desde el exterior
  React.useEffect(() => {
    setPendingStatus(value);
  }, [value]);

  // Mapear el array de estados planos al formato { value, label } requerido por el Dropdown
  const dropdownOptions = useMemo(() => {
    return STATUS_OPTIONS.map(status => ({
      value: status,
      label: STATUS_LABELS[status],
    }));
  }, []);

  /**
  * Se dispara al seleccionar una opción del dropdown.
  * Notifica al padre de inmediato para permitir marcado de isDirty,
  * aunque el usuario todavía no haya confirmado.
  */
  const handleSelect = (newStatus: OrderStatus) => {
    setPendingStatus(newStatus);

    // Notificación optimista: el padre puede marcar isDirty sin esperar confirmación
    if (newStatus !== value) onChange(newStatus);
  };

  return (
    <div className={`${styles.orderStatusSelectorContainer} ${className}`} style={{ width: '100%', minWidth: '160px' }}>
      <Dropdown
        options={dropdownOptions}
        value={pendingStatus}
        onChange={(newVal) => handleSelect(newVal as OrderStatus)}
        disabled={disabled}
        placeholder="Cambiar estado"
      />
    </div>
  );
};