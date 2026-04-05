import React from 'react';
import styles from '../AdminOrders.module.css';
import type { OrderStatus } from '../ordersService';

interface Props {
  status: OrderStatus;
}

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

  return (
    <span className={className}>
      {indicator}
      <span className={styles.statusTagText}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </span>
  );
};

export default OrderStatusTag;
