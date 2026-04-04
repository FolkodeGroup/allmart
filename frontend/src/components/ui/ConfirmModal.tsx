import React, { useEffect, useRef } from 'react';
import styles from './ConfirmModal.module.css';
import { Modal } from './Modal';

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
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (open && confirmRef.current) {
            confirmRef.current.focus();
        }
    }, [open]);

    if (!open) return null;
    return (
        <Modal
            open={open}
            onClose={onCancel}
            title={title}
            disableClose={loading}
            size="sm"
            actionsClassName={styles.actions}
            actions={
                <>
                    <button
                        className={styles.cancelBtn}
                        onClick={onCancel}
                        disabled={loading}
                        type="button"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmRef}
                        className={styles.confirmBtn}
                        onClick={onConfirm}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? 'Procesando...' : confirmLabel}
                    </button>
                </>
            }
        >
            <div id="modal-desc" className={styles.message}>{message}</div>
        </Modal>
    );
};