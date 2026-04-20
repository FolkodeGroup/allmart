// OrderTimeline.tsx
// Componente para mostrar el historial de estados de un pedido en forma de línea de tiempo visual.

import React from 'react';
import type { OrderHistoryEntry, OrderStatus } from '../../../../context/AdminOrdersContext';
import styles from '../AdminOrders.module.css';
import { STATUS_LABELS, statusClass, formatDateTime, STATUS_ICONS } from '../utils/ordersHelpers';

interface OrderTimelineProps {
  history: OrderHistoryEntry[];
  currentStatus: OrderStatus;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ history, currentStatus }) => {
  if (!history || history.length === 0) {
    return (
      <p className={styles.timelineEmpty}>No hay registros de cambios de estado aún.</p>
    );
  }
  // Invertimos para mostrar el estado más reciente primero
  const sorted = [...history].reverse();
  return (
    <ol className={styles.timeline}>
      {sorted.map((entry, idx) => {
        const isCurrent = entry.status === currentStatus && idx === 0;
        const isLast = idx === sorted.length - 1;
        return (
          <li key={entry.changedAt + idx} className={`${styles.timelineItem} ${isCurrent ? styles.timelineItemCurrent : ''}`} style={{ animationDelay: `${idx * 60}ms` }}>
            <div className={styles.timelineDotWrap}>
              <span className={styles.timelineDot}>{STATUS_ICONS[entry.status]}</span>
              {!isLast && <span className={styles.timelineLine} />}
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={`${styles.statusBadge} ${statusClass(entry.status, styles)}`}>{STATUS_LABELS[entry.status]}</span>
                {isCurrent && <span className={styles.timelineCurrentTag}>Estado actual</span>}
              </div>
              <time className={styles.timelineDate}>{formatDateTime(entry.changedAt)}</time>
              {entry.note && <p className={styles.timelineNote}>{entry.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
