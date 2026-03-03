import React from 'react';
import styles from './MetricCard.module.css';

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  variation: number; // porcentaje
}

export function MetricCard({ title, icon, value, variation }: MetricCardProps) {
  const isPositive = variation >= 0;
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.variation}>
        <span className={isPositive ? styles.arrowUp : styles.arrowDown}>
          {isPositive ? '▲' : '▼'}
        </span>
        <span className={isPositive ? styles.positive : styles.negative}>
          {Math.abs(variation).toFixed(1)}%
        </span>
        <span className={styles.label}>vs mes anterior</span>
      </div>
    </div>
  );
}
export default MetricCard;
