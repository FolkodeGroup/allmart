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
    setPendingStatus(e.target.value as OrderStatus);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    if (pendingStatus !== value) onChange(pendingStatus);
  };

  const handleCancel = () => {
    setPendingStatus(value);
    setShowConfirm(false);
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
      {showConfirm && (
        <div className={styles.statusConfirmBox}>
          <span className={styles.statusConfirmText}>
            ¿Confirmar cambio de estado a "{STATUS_LABELS[pendingStatus as keyof typeof STATUS_LABELS]}"?
          </span>
          <div className={styles.statusConfirmActions}>
            <button className={styles.applyStatusBtn} type="button" onClick={handleConfirm}>
              Confirmar
            </button>
            <button className={styles.cancelBtn} type="button" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
