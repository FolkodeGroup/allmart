import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'discount' | 'new' | 'outOfStock';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'new', children, className = '' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
