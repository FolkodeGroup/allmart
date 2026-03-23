import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useNotification } from '../../../context/NotificationContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
// import { logAdminActivity } from '../../../services/adminActivityLogService';
// import { AdminCategoryForm } from './AdminCategoryForm'; // Temporalmente deshabilitado si no existe
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FolderSearch, AlertCircle } from 'lucide-react';
import { CategoriesGrid } from './CategoriesGrid';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminCategories.module.css';
import { CategorySearchInput } from '../../../components/ui/CategorySearchInput';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export function AdminCategories() {
  const { categories, isLoading: loading, error, refreshCategories, totalPages: apiTotalPages, total } = useAdminCategories();
  // Local state for pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Could be made configurable
  const { can } = useAdminAuth();
  const [search, setSearch] = useState('');
  // Para UX: si el usuario selecciona una sugerencia, forzar búsqueda exacta
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showNotification } = useNotification();


  // Debounce para búsqueda instantánea

  // Debounce para búsqueda instantánea
  const debouncedSearch = useDebouncedValue(search, 350);

  // Fetch categories when page, limit, or search changes
  useEffect(() => {
    refreshCategories({ q: selectedSuggestion || debouncedSearch, page, limit });
    if (selectedSuggestion) setSelectedSuggestion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedSuggestion, page, limit, refreshCategories]);

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);


  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleNew = () => { setEditId(null); setShowForm(true); };
  const handleEdit = (id: string) => { setEditId(id); setShowForm(true); };
  // const auth = useAdminAuth ? useAdminAuth() : null;
  // const userEmail = (auth && (auth.user as any)?.email) || 'desconocido';

  // Eliminar categoría con confirmación y feedback
  const { deleteCategory } = useAdminCategories();
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteCategory(id);
      showNotification('success', 'Categoría eliminada correctamente');
      refreshCategories({ q: selectedSuggestion || debouncedSearch, page, limit });
    } catch (err: any) {
      const msg = err?.message || 'Error al eliminar la categoría';
      showNotification('error', msg);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`}>
        {/* Header */}
        <div className={sectionStyles.header}>
          <div className={styles.headerTop}>
            <div>
              <span className={sectionStyles.label}>Administración</span>
              <h1 className={sectionStyles.title}>
                <span className={sectionStyles.icon}>📁</span> Categorías
              </h1>
              <p className={sectionStyles.subtitle}>
                Gestioná las categorías del catálogo para organizar tus productos.
              </p>
            </div>
            {can('categories.create') && (
              <button className={styles.newBtn} onClick={handleNew}>
                + Nueva categoría
              </button>
            )}
          </div>
        </div>

        {/* Filtros fuera del header */}
        <div className={styles.filters}>
          <CategorySearchInput
            categories={categories}
            value={search}
            onChange={setSearch}
            onSelectSuggestion={cat => {
              setSearch(cat.name);
              setSelectedSuggestion(cat.name);
            }}
            placeholder="Buscar por nombre o slug..."
          />
          <span className={styles.count}>{total} categorías</span>
        </div>

      {/* Tabla */}
      {loading && <LoadingSpinner message="Cargando categorías..." size="lg" />}

      {!loading && error && (
        <EmptyState
          icon={<AlertCircle size={48} color="#ef4444" />}
          title="Error al cargar categorías"
          description={error}
          action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
        />
      )}

      {!loading && !error && (categories.length === 0 ? (
        <EmptyState
          icon={<FolderSearch size={48} color="#94a3b8" />}
          title="No se encontraron categorías"
          description={search
            ? "No hay resultados para tu búsqueda. Probá con otro término."
            : "Todavía no cargaste ninguna categoría al catálogo."
          }
          action={can('categories.create') ? { label: 'Nueva Categoría', onClick: handleNew } : undefined}
        />
      ) : (
        <CategoriesGrid
          categories={categories}
          onEdit={can('categories.edit') ? handleEdit : undefined}
          onDelete={can('categories.delete') ? (id => setDeleteConfirm(id)) : undefined}
          canEdit={can('categories.edit')}
          canDelete={can('categories.delete')}
          getProductCount={cat => cat.itemCount}
        />
      ))}

      {/* Controles de paginación */}
      {total > limit && (
        <div className={styles.pagination} style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <button
            className={styles.pageBtn}
            disabled={page === 1 || loading}
            onClick={() => handlePageChange(page - 1)}
          >Anterior</button>
          {Array.from({ length: apiTotalPages }, (_, i) => (
            <button
              key={i + 1}
              className={styles.pageBtn + (page === i + 1 ? ' ' + styles.pageActive : '')}
              disabled={page === i + 1 || loading}
              onClick={() => handlePageChange(i + 1)}
            >{i + 1}</button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={page === apiTotalPages || loading}
            onClick={() => handlePageChange(page + 1)}
          >Siguiente</button>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => (deleting ? undefined : setDeleteConfirm(null))}
        title="Eliminar categoría"
        actions={
          <>
            <button
              className={styles.deleteBtn}
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleting}
              style={{ minWidth: 100 }}
            >
              {deleting ? 'Eliminando...' : 'Confirmar'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
              style={{ minWidth: 100 }}
            >Cancelar</button>
          </>
        }
        disableClose={deleting}
      >
        <p>¿Estás seguro de que querés eliminar esta categoría?</p>
      </Modal>

      {/* Modal de formulario - Deshabilitado por falta de componente */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: 400 }}>
             <p><b>Componente Formulario no encontrado.</b></p>
             <p style={{ fontSize: '0.95em', color: '#666', marginTop: 8 }}>
               Cuando se implemente el formulario de edición/creación de categoría, debe incluir:<br />
               <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                 <li>Feedback visual de loading en el botón/inputs</li>
                 <li>Notificaciones de éxito y error usando <code>useNotification</code></li>
                 <li>Evitar submits múltiples y validar errores</li>
               </ul>
             </p>
             <button onClick={() => setShowForm(false)} style={{ marginTop: 16 }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
