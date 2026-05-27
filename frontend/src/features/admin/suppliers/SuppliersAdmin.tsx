import React, { useState, useCallback } from 'react';
import { SuppliersMasterDetail } from './SuppliersMasterDetail';
import { SupplierModal } from './SupplierModal';
import styles from './SuppliersAdmin.module.css';
import sectionStyles from '../shared/AdminSection.module.css';

export function SuppliersAdmin() {
    const [modalSupplierId, setModalSupplierId] = useState<string | null | undefined>(undefined);
    const [reloadKey, setReloadKey] = useState(0);

    const handleNew = useCallback(() => setModalSupplierId(null), []);
    const handleEdit = useCallback((id: string) => setModalSupplierId(id), []);
    const handleSaved = useCallback(() => setReloadKey(k => k + 1), []);
    const handleClose = useCallback(() => setModalSupplierId(undefined), []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={sectionStyles.title}>Proveedores</h2>
                    <p className={styles.description}>Administrá los proveedores y sus precios</p>
                </div>
            </div>

            <SuppliersMasterDetail
                key={reloadKey}
                onNew={handleNew}
                onEdit={handleEdit}
            />

            {modalSupplierId !== undefined && (
                <SupplierModal
                    supplierId={modalSupplierId}
                    onClose={handleClose}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}