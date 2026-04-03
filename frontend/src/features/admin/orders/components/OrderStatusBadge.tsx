import React from 'react';
import { STATUS_LABELS, statusClass } from '../utils/ordersHelpers';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';
import styles from '../../orders/AdminOrders.module.css';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className }) => (
  <span
    className={`${styles.statusBadge} ${statusClass(status, styles)}${className ? ' ' + className : ''}`}
    aria-label={`Estado: ${STATUS_LABELS[status]}`}
    role="status"
    aria-live="polite"
    tabIndex={0}
  >
    {STATUS_LABELS[status]}
  </span>
);
