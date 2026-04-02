import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  id?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  id,
}) => {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // id accesible y estable
  const reactId = typeof useId === 'function' ? useId() : undefined;
  const idRef = useRef(id || reactId || `tooltip-${Math.random().toString(36).slice(2, 10)}`);
  const tooltipId = idRef.current;

  const show = () => {
    timeout.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    setVisible(false);
  };

  // ✅ Limpieza correcta (CLAVE)
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  return (
    <span
      className={styles.wrapper}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={-1}
      aria-describedby={tooltipId}
    >
      {children}

      {visible && (
        <span
          id={tooltipId}
          className={`${styles.tooltip} ${
            placement === 'top' ? styles.top :
            placement === 'bottom' ? styles.bottom :
            placement === 'left' ? styles.left :
            placement === 'right' ? styles.right : ''
          }`}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </span>
  );
};