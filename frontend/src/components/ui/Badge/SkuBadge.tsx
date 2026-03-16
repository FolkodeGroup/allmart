import React from 'react';
import styles from './Badge.module.css';

interface SkuBadgeProps {
  sku: string;
  className?: string;
}

export const SkuBadge: React.FC<SkuBadgeProps> = ({ sku, className = '' }) => (
  <span
    className={`${styles.badge} ${styles.sku} rounded-md px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 border border-gray-300 ${className}`}
    title="SKU"
  >
    {sku}
  </span>
);
