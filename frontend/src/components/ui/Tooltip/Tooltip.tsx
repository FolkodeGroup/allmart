import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode, ReactElement } from 'react';
import styles from './Tooltip.module.css';

export type TooltipPosition = 'top' | 'bottom';

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  position?: TooltipPosition;
  className?: string;
  id?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  id,
}) => {
  const [visible, setVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>(position);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = id || `tooltip-${Math.random().toString(36).slice(2, 10)}`;

  // Posición inteligente
  useEffect(() => {
    if (visible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const spaceAbove = triggerRect.top;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      if (position === 'top' && spaceAbove < tooltipRect.height + 12 && spaceBelow > spaceAbove) {
        setTooltipPos('bottom');
      } else if (position === 'bottom' && spaceBelow < tooltipRect.height + 12 && spaceAbove > spaceBelow) {
        setTooltipPos('top');
      } else {
        setTooltipPos(position);
      }
    }
  }, [visible, position]);

  // Accesibilidad: mostrar en focus
  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  // Asegurar que children es ReactElement con props
  // Forzar tabIndex en el wrapper solo si el hijo no lo tiene
  // Acceso seguro a props dinámicos
  const childTabIndex = ((children.props as any)?.tabIndex);
  return (
    <span
      className={styles.tooltipWrapper + (className ? ' ' + className : '')}
      ref={triggerRef}
      tabIndex={typeof childTabIndex === 'number' ? undefined : 0}
      aria-describedby={tooltipId}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{display: 'inline-block', position: 'relative'}}
    >
      {React.cloneElement(
        children,
        {
          ...(typeof childTabIndex === 'number' ? {} : { tabIndex: 0 }),
          ...(typeof children.type === 'string' && ["button", "input", "select", "textarea", "a", "div", "span"].includes(children.type)
            ? { 'aria-describedby': tooltipId }
            : {}),
        }
      )}
      {visible && (
        <div
          className={
            styles.tooltip +
            ' ' + styles[`tooltip_${tooltipPos}`]
          }
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </span>
  );
};
