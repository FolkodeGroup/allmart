import type { FC, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  disableClose?: boolean;
}

export const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  disableClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

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
    const focusableEls = modalRef.current?.querySelectorAll<HTMLElement>(focusableSelectors.join(','));
    if (focusableEls && focusableEls.length > 0) {
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
        if (!focusableEls || focusableEls.length === 0) return;
        const first = focusableEls[0];
        const last = focusableEls[focusableEls.length - 1];
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

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => !disableClose && onClose()}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      tabIndex={-1}
      ref={modalRef}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {title && (
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
        )}

        <div className={styles.body}>{children}</div>

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
};