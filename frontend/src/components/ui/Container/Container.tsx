import type { ReactNode } from 'react';
import styles from './Container.module.css';

interface ContainerProps {
  children: ReactNode;
  narrow?: boolean;
  className?: string;
  as?: keyof HTMLElementTagNameMap;
}

export function Container({
  children,
  narrow = false,
  className = '',
  as: Tag = 'div',
}: ContainerProps) {
  const classes = [
    styles.container,
    narrow ? styles.narrow : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Tag className={classes}>{children}</Tag>;
}
