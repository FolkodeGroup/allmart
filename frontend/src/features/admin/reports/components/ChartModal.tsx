import React from 'react';
import styles from '../AdminReports.module.css';
import { Modal } from '../../../../components/ui/Modal';

interface ChartModalProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

// Modal reutilizable para gráficos expandibles
export const ChartModal: React.FC<ChartModalProps> = ({ open, onClose, children }) => {
    if (!open) return null;
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Grafico expandido"
            size="xl"
            showCloseButton
            bodyClassName={styles.chartModalBody}
        >
            <div className={styles.chartModalInner}>{children}</div>
        </Modal>
    );
};
