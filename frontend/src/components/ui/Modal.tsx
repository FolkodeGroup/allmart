import type { FC, ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants } from '../../features/admin/categories/animationConfig';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  disableClose?: boolean;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  className?: string;
  bodyClassName?: string;
  actionsClassName?: string;
  overlayClassName?: string;
  layout?: 'default' | 'flush';
}

export const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  disableClose,
  showCloseButton = false,
  size = 'md',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  className,
  bodyClassName,
  actionsClassName,
  overlayClassName,
  layout = 'default',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef<string>('');
  const previousPaddingRight = useRef<string>('');
  const titleId = useId();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const root = document.documentElement;
    previousOverflow.current = body.style.overflow;
    previousPaddingRight.current = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - root.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow.current;
      body.style.paddingRight = previousPaddingRight.current;
    };
  }, [open]);

  // Focus trap and restore
  useEffect(() => {
    if (!open) return;

    // Save last focused element
    lastFocusedElement.current = document.activeElement as HTMLElement;

    // Focus first focusable element in modal
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    const getFocusableEls = () =>
      modalRef.current?.querySelectorAll<HTMLElement>(focusableSelectors.join(',')) ?? [];

    const focusableEls = getFocusableEls();
    if (focusableEls.length > 0) {
      focusableEls[0].focus();
    } else if (modalRef.current) {
      modalRef.current.focus();
    }

    // Trap focus inside modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableClose) {
        onClose();
      }
      if (e.key === 'Tab') {
        const currentFocusable = getFocusableEls();
        if (currentFocusable.length === 0) return;
        const first = currentFocusable[0];
        const last = currentFocusable[currentFocusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      }
    };
  }, [open, onClose, disableClose]);

  const isFull = size === 'full';
  const sizeClass =
    size === 'sm'
      ? styles.modalSm
      : size === 'lg'
        ? styles.modalLg
        : size === 'xl'
          ? styles.modalXl
          : size === 'full'
            ? styles.modalFull
          : styles.modalMd;
  const isFlush = layout === 'flush';
  const flushClass = isFlush ? styles.modalFlush : '';
  const overlaySizeClass = isFull ? styles.overlayFull : '';
  const labelledBy = ariaLabelledBy ?? (title ? titleId : undefined);

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`${styles.overlay}${overlaySizeClass ? ` ${overlaySizeClass}` : ''}${overlayClassName ? ` ${overlayClassName}` : ''}`}
          role="presentation"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
        >
          {!disableClose && (
            <button
              type="button"
              className={styles.overlayClose}
              onClick={onClose}
              aria-label="Cerrar"
              tabIndex={-1}
            />
          )}
          <div
            className={`${styles.modal} ${sizeClass} ${flushClass}${className ? ` ${className}` : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            ref={modalRef}
            tabIndex={-1}
          >
            {showCloseButton && !disableClose && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Cerrar"
              >
                ×
              </button>
            )}

            {!isFlush && title && (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            )}

            {isFlush ? (
              children
            ) : (
              <div className={`${styles.body}${bodyClassName ? ` ${bodyClassName}` : ''}`}>
                {children}
              </div>
            )}

            {!isFlush && actions && (
              <div className={`${styles.actions}${actionsClassName ? ` ${actionsClassName}` : ''}`}>
                {actions}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};