import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Pagination } from '../reports/components/Pagination';
import { Button } from '../../../components/ui/Button/Button';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useSuppliers } from '../../../hooks/useSuppliers';
import styles from './SuppliersAdmin.module.css';
import sectionStyles from '../shared/AdminSection.module.css';

export function SuppliersAdmin() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const navigate = useNavigate();
    const {
        suppliers, loading, error,
        deleteId, setDeleteId, confirmDelete,
    } = useSuppliers();
    const total = suppliers.length;

    const paginatedSuppliers = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return suppliers.slice(start, end);
    }, [suppliers, page, pageSize]);

    useEffect(() => {
        const totalPages = Math.ceil(suppliers.length / pageSize);
        if (page > totalPages) {
            setPage(totalPages || 1);
        }
    }, [suppliers.length, page, pageSize]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={sectionStyles.title}>Proveedores</h2>
                    <p className={sectionStyles.description}>Administra los proveedores de tu catálogo</p>
                </div>
                <Button
                    type="button"
                    onClick={() => navigate('/admin/proveedores/nuevo')}
                >
                    + Nuevo proveedor
                </Button>
            </div>

            {
                error && (
                    <p className={styles.errorBanner} role="alert">{error}</p>
                )
            }

            {
                loading ? (
                    <LoadingSpinner message="Cargando proveedores..." />
                ) : suppliers.length === 0 ? (
                    <EmptyState
                        title="Sin proveedores"
                        description="No hay proveedores cargados. Creá el primero."
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Página</th>
                                    <th>Teléfono</th>
                                    <th>Dirección</th>
                                    <th>Productos</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedSuppliers.map((s) => (
                                    <tr key={s.id}>
                                        <td className={styles.cellName}>{s.name}</td>
                                        <td>
                                            {s.url ? (
                                                <a
                                                    href={s.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.link}
                                                >
                                                    {s.url}
                                                </a>
                                            ) : (
                                                <span className={styles.empty}>—</span>
                                            )}
                                        </td>
                                        <td>{s.phone}</td>
                                        <td>{s.address}</td>
                                        <td>{s.products}</td>
                                        <td className={styles.actions}>
                                            <div className={styles.actionsInner}>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    type="button"
                                                    onClick={() => navigate(`/admin/proveedores/${s.id}/editar`)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    type="button"
                                                    onClick={() => setDeleteId(s.id)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination
                            page={page}
                            pageSize={pageSize}
                            total={total}
                            onPageChange={setPage}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}
                        />
                    </div>
                )
            }

            <ModalConfirm
                open={!!deleteId}
                title="Eliminar proveedor"
                description="¿Estás seguro de que querés eliminar este proveedor? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div >
    );
}