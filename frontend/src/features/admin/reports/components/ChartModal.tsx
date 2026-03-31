import React from 'react';
import styles from '../AdminReports.module.css';

interface ChartModalProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

// Modal reutilizable para gráficos expandibles
export const ChartModal: React.FC<ChartModalProps> = ({ open, onClose, children }) => {
    // Cierra modal con Escape
    React.useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div
            className={styles.chartModalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Gráfico expandido"
        >
            <button
                className={styles.chartModalOverlayCloseBtn}
                onClick={onClose}
                aria-label="Cerrar gráfico"
                style={{ position: 'fixed', inset: 0, opacity: 0, zIndex: 1, cursor: 'pointer' }}
                tabIndex={0}
            />
            <div
                className={styles.chartModalContent}
                role="document"
                aria-label="Contenido del gráfico expandido"
                tabIndex={-1}
            >
                <button className={styles.chartModalClose} onClick={onClose} aria-label="Cerrar gráfico">×</button>
                <div className={styles.chartModalInner}>{children}</div>
            </div>
        </div>
    );
};
