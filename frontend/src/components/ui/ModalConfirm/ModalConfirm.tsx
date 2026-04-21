import React from 'react';
import styles from './ModalConfirm.module.css';
import { Modal } from '../Modal';

interface ModalConfirmProps {
  open: boolean;
  title?: string;
  /** Texto del cuerpo del modal. También acepta `description` como alias. */
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ModalConfirm: React.FC<ModalConfirmProps> = ({
  open,
  title = 'Confirmar acción',
  message,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      actionsClassName={styles.actions}
      actions={
        <>
          <button className={styles.confirmBtn} onClick={onConfirm} aria-label={confirmText}>
            {confirmText}
          </button>
          <button className={styles.cancelBtn} onClick={onCancel} aria-label={cancelText}>
            {cancelText}
          </button>
        </>
      }
    >
      <div className={styles.message} aria-live="polite">
        {message ?? description}
      </div>
    </Modal>
  );
};
