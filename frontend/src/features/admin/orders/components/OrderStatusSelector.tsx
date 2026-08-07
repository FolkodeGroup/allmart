import React, { useState, useMemo } from 'react';
import { STATUS_OPTIONS, STATUS_LABELS, ALLOWED_TRANSITIONS } from '../utils/ordersHelpers';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';
import styles from '../AdminOrders.module.css';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

interface OrderStatusSelectorProps {
  value: OrderStatus;
  onChange: (newStatus: OrderStatus) => void;
  disabled?: boolean;
  className?: string;
  filterByAllowedTransitions?: boolean;
}

export const OrderStatusSelector: React.FC<OrderStatusSelectorProps> = ({
  value,
  onChange,
  disabled,
  className = '',
  filterByAllowedTransitions = true,
}) => {
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(value);

  React.useEffect(() => {
    setPendingStatus(value);
  }, [value]);

  const dropdownOptions = useMemo(() => {
    const allowed = ALLOWED_TRANSITIONS[value] ?? [];
    return STATUS_OPTIONS.map(status => {
      const isCurrent = status === value;
      const isAllowed = !filterByAllowedTransitions || isCurrent || allowed.includes(status);

      return {
        value: status,
        label: isCurrent
          ? `${STATUS_LABELS[status]} (Actual)`
          : isAllowed
          ? STATUS_LABELS[status]
          : `${STATUS_LABELS[status]} (Bloqueado)`,
        disabled: !isAllowed,
      };
    }).filter(opt => !filterByAllowedTransitions || !opt.disabled);
  }, [value, filterByAllowedTransitions]);

  const handleSelect = (newStatus: OrderStatus) => {
    setPendingStatus(newStatus);
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