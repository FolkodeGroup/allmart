import { useState, useCallback, useEffect } from 'react';
import { SuppliersMasterDetail } from './SuppliersMasterDetail';
import { SupplierModal } from './SupplierModal';
import styles from './SuppliersAdmin.module.css';
import sectionStyles from '../shared/AdminSection.module.css';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';
import { suppliersAdminService, type AdminSupplierV2 } from './suppliersAdminService';

export function SuppliersAdmin() {
    const [modalSupplierId, setModalSupplierId] = useState<string | null | undefined>(undefined);
    const [reloadKey, setReloadKey] = useState(0);
    const [suppliers, setSuppliers] = useState<AdminSupplierV2[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    useEffect(() => {
        const fetchSuppliers = async () => {
            setLoading(true);
            try {
                const res = await suppliersAdminService.listSuppliers({ page });

                setSuppliers(res.data);
                console.log('Suppliers fetched:', res.data);
                setTotalPages(res.totalPages);
            } catch (error) {
                console.error('Error al traer proveedores', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuppliers();
    }, [page, reloadKey]);
    const handleNew = useCallback(() => setModalSupplierId(null), []);
    const handleEdit = useCallback((id: string) => setModalSupplierId(id), []);
    const handleSaved = useCallback(() => {
        setPage(1); // opcional
        setReloadKey(k => k + 1);
    }, []);
    const handleClose = useCallback(() => setModalSupplierId(undefined), []);
    const handleDeleted = useCallback(() => {
        setReloadKey(k => k + 1);
    }, []);

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
                suppliers={suppliers}
                loading={loading}
                onNew={handleNew}
                onEdit={handleEdit}
                onDeleted={handleDeleted}
            />

            {totalPages > 1 && (
                <AdminPagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    ariaLabel="Paginación de proveedores"
                />
            )}

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