import React from 'react';
import styles from './ConfirmModal.module.css';

export interface ConfirmModalProps {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
    // Nuevas props opcionales pueden agregarse aquí sin romper la API
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    onCancel,
    loading = false,
}) => {
    if (!open) return null;
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                {title && <h3 className={styles.title}>{title}</h3>}
                <div className={styles.message}>{message}</div>
                <div className={styles.actions}>
                    <button
                        className={styles.cancelBtn}
                        onClick={onCancel}
                        disabled={loading}
                        type="button"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className={styles.confirmBtn}
                        onClick={onConfirm}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? 'Procesando...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};