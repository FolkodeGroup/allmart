import React, { useEffect, useRef } from 'react';
import styles from './ModalConfirm.module.css';

interface ModalConfirmProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ModalConfirm: React.FC<ModalConfirmProps> = ({
  open,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onCancel();
  }

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      tabIndex={0}
      aria-modal="true"
      aria-labelledby="modal-confirm-title"
      ref={dialogRef}
    >
      <div className={styles.panel}>
        {title && <h2 id="modal-confirm-title" className={styles.title}>{title}</h2>}
        <div className={styles.message} aria-live="polite">{message}</div>
        <div className={styles.actions}>
          <button className={styles.confirmBtn} onClick={onConfirm} aria-label={confirmText}>{confirmText}</button>
          <button className={styles.cancelBtn} onClick={onCancel} aria-label={cancelText}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
};
