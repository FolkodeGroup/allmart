import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useSuppliers } from '../../../hooks/useSuppliers';
import styles from './SuppliersAdmin.module.css';

export function SuppliersAdmin() {
    const navigate = useNavigate();
    const {
        suppliers, loading, error,
        deleteId, setDeleteId, confirmDelete,
    } = useSuppliers();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Proveedores</h2>
                <Button
                    type="button"
                    onClick={() => navigate('/admin/proveedores/nuevo')}
                >
                    + Nuevo proveedor
                </Button>
            </div>

            {error && (
                <p className={styles.errorBanner} role="alert">{error}</p>
            )}

            {loading ? (
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
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((s) => (
                                <tr key={s.id}>
                                    <td className={styles.cellName}>{s.name}</td>
                                    <td>
                                        <a
                                            href={s.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.link}
                                        >
                                            {s.url}
                                        </a>
                                    </td>
                                    <td>{s.phone}</td>
                                    <td>{s.address}</td>
                                    <td>{s.products}</td>
                                    <td className={styles.actions}>
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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