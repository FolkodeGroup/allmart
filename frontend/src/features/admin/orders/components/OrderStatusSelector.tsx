import React, { useState } from 'react';
import { STATUS_OPTIONS, STATUS_LABELS } from './../utils/ordersHelpers';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';
import styles from '../AdminOrders.module.css';

interface OrderStatusSelectorProps {
  value: OrderStatus;
  onChange: (newStatus: OrderStatus) => void;
  disabled?: boolean;
  className?: string;
}

export const OrderStatusSelector: React.FC<OrderStatusSelectorProps> = ({ value, onChange, disabled, className }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(value);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    setPendingStatus(newStatus);
    setShowConfirm(true);

    // Notificar al padre inmediatamente para que pueda marcar isDirty
    // aunque el usuario todavía no confirmó, el valor cambió
    if (newStatus !== value) onChange(newStatus);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setPendingStatus(value);
    setShowConfirm(false);
    onChange(value);
  };

  return (
    <div className={className} style={{ display: 'inline-block', position: 'relative' }}>
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
