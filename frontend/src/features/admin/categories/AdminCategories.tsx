import { CategoriesPagination } from './components/CategoriesPagination';
// import type { Category } from './types/category';
import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useNotification } from '../../../context/NotificationContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useCategorySelection } from './hooks/useCategorySelection';
import { BulkEditCategoriesBar } from './BulkEditCategoriesBar';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FolderSearch, AlertCircle } from 'lucide-react';
import { CategoriesGrid } from './CategoriesGrid';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminCategories.module.css';
import { CategoriesHeader } from './components/CategoriesHeader';
import { exportCategoriesToCSV, exportCategoriesToExcel } from './utils/exportCategories';
import { CategoriesFilters } from './components/CategoriesFilters';
// import { CategorySearchInput } from '../../../components/ui/CategorySearchInput';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useCategoryBulkEdit } from './hooks/useCategoryBulkEdit';


export function AdminCategories() {
  const { categories, isLoading: loading, error, refreshCategories, totalPages: apiTotalPages, total, updateCategory, deleteCategory } = useAdminCategories();
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
  // Estado para cambio de visibilidad
  const [toggleConfirm, setToggleConfirm] = useState<{ id: string; newVisible: boolean } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [optimisticVis, setOptimisticVis] = useState<Record<string, boolean>>({});
  const { showNotification } = useNotification();

  // Filtros avanzados
  const [minProducts, setMinProducts] = useState<number | ''>('');
  const [maxProducts, setMaxProducts] = useState<number | ''>('');
  const [isVisible, setIsVisible] = useState<'all' | 'visible' | 'hidden'>('all');

  // Debounce para búsqueda instantánea
  const debouncedSearch = useDebouncedValue(search, 350);

  // Selección múltiple (extraído a hook personalizado)
  const {
    selectedIds,
    allVisibleSelected,
    handleSelectAllVisible,
    handleSelectCategory,
    clearSelection
  } = useCategorySelection(categories);

  // Estado y lógica para edición masiva (extraído a hook personalizado)
  const {
    showBulkEdit,
    setShowBulkEdit,
    bulkEditLoading,
    setBulkEditLoading,
    bulkEditData,
    // setBulkEditData,
    handleBulkEdit
  } = useCategoryBulkEdit();

  // Fetch categories when filtros cambian
  useEffect(() => {
    refreshCategories({
      q: selectedSuggestion || debouncedSearch,
      page,
      limit,
      minProducts: minProducts === '' ? undefined : minProducts,
      maxProducts: maxProducts === '' ? undefined : maxProducts,
      isVisible: isVisible === 'all' ? undefined : isVisible === 'visible' ? true : false,
    });
    if (selectedSuggestion) setSelectedSuggestion(null);
  }, [debouncedSearch, selectedSuggestion, page, limit, minProducts, maxProducts, isVisible, refreshCategories]);

  // Reset page to 1 cuando cambia búsqueda o filtros
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, minProducts, maxProducts, isVisible]);


  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleNew = () => { setEditId(null); setShowForm(true); };
  const handleEdit = (id: string) => { setEditId(id); setShowForm(true); };
  // const auth = useAdminAuth ? useAdminAuth() : null;
  // const userEmail = (auth && (auth.user as any)?.email) || 'desconocido';

  // Eliminar categoría con confirmación y feedback
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

  // (Eliminado: handleBulkEdit inline, ahora se usa el del hook personalizado)

  // Handler para toggle de visibilidad (abre modal de confirmación)
  const handleToggleVisibility = (id: string, newVisible: boolean) => {
    setToggleConfirm({ id, newVisible });
  };

  // Confirmar cambio de visibilidad
  const confirmToggleVisibility = async () => {
    if (!toggleConfirm) return;
    const { id, newVisible } = toggleConfirm;
    setTogglingId(id);
    setOptimisticVis(prev => ({ ...prev, [id]: newVisible }));
    try {
      await updateCategory(id, { isVisible: newVisible });
      showNotification('success', newVisible ? 'Categoría visible' : 'Categoría oculta');
    } catch (err: any) {
      setOptimisticVis(prev => ({ ...prev, [id]: !newVisible }));
      showNotification('error', err?.message || 'Error al cambiar visibilidad');
    } finally {
      setTogglingId(null);
      setToggleConfirm(null);
      refreshCategories({ q: selectedSuggestion || debouncedSearch, page, limit });
    }
  };

  // Pasar estado optimista a las categorías
  const categoriesWithOptimism = categories.map(cat =>
    optimisticVis[cat.id] !== undefined ? { ...cat, isVisible: optimisticVis[cat.id] } : cat
  );

  // Export handlers
  const handleExportCSV = () => {
    if (!categoriesWithOptimism.length) {
      showNotification('info', 'No hay categorías para exportar.');
      return;
    }
    exportCategoriesToCSV(categoriesWithOptimism);
  };
  const handleExportExcel = () => {
    if (!categoriesWithOptimism.length) {
      showNotification('info', 'No hay categorías para exportar.');
      return;
    }
    exportCategoriesToExcel(categoriesWithOptimism);
  };

  return (
    <div className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`}>

        {/* Header */}

        <CategoriesHeader
          canCreate={can('categories.create')}
          onNew={handleNew}
        />

        {/* Botones de exportación debajo del header */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center'}}>
          <button className={styles.exportBtn} onClick={handleExportCSV} type="button" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e2dd', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d0ccc7'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e2dd'; e.currentTarget.style.boxShadow = 'none'; }}>
            Exportar CSV
          </button>
          <button className={styles.exportBtn} onClick={handleExportExcel} type="button" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e2dd', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d0ccc7'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e2dd'; e.currentTarget.style.boxShadow = 'none'; }}>
            Exportar Excel
          </button>
        </div>


        {/* Filtros fuera del header */}
        <CategoriesFilters
          categories={categories}
          search={search}
          setSearch={setSearch}
          setSelectedSuggestion={setSelectedSuggestion}
          total={total}
          minProducts={minProducts}
          setMinProducts={setMinProducts}
          maxProducts={maxProducts}
          setMaxProducts={setMaxProducts}
          isVisible={isVisible}
          setIsVisible={setIsVisible}
        />

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
          categories={categoriesWithOptimism}
          onEdit={can('categories.edit') ? handleEdit : undefined}
          onDelete={can('categories.delete') ? (id => setDeleteConfirm(id)) : undefined}
          canEdit={can('categories.edit')}
          canDelete={can('categories.delete')}
          getProductCount={cat => cat.itemCount}
          selectedIds={selectedIds}
          onSelect={handleSelectCategory}
          allSelected={allVisibleSelected}
          onSelectAll={handleSelectAllVisible}
          onToggleVisibility={can('categories.edit') ? handleToggleVisibility : undefined}
        />
      ))}

      {/* Modal de confirmación de visibilidad */}
      <Modal
        open={!!toggleConfirm}
        onClose={() => (togglingId ? undefined : setToggleConfirm(null))}
        title={toggleConfirm?.newVisible ? 'Mostrar categoría' : 'Ocultar categoría'}
        actions={
          <>
            <button
              className={styles.deleteBtn}
              onClick={confirmToggleVisibility}
              disabled={!!togglingId}
              style={{ minWidth: 100 }}
            >
              {togglingId ? 'Guardando...' : 'Confirmar'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setToggleConfirm(null)}
              disabled={!!togglingId}
              style={{ minWidth: 100 }}
            >Cancelar</button>
          </>
        }
        disableClose={!!togglingId}
      >
        <p>
          {toggleConfirm?.newVisible
            ? '¿Mostrar esta categoría? Será visible para los usuarios.'
            : '¿Ocultar esta categoría? No será visible para los usuarios.'}
        </p>
      </Modal>

      {/* Controles de paginación extraídos a subcomponente */}
      <CategoriesPagination
        page={page}
        totalPages={apiTotalPages}
        loading={loading}
        onPageChange={handlePageChange}
      />

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

      {/* Barra de acciones masivas */}
      {!loading && !error && selectedIds.length > 0 && (
        <BulkEditCategoriesBar
          selectedCount={selectedIds.length}
          loading={bulkEditLoading}
          onBulkEdit={handleBulkEdit}
          onCancel={() => clearSelection()}
        />
      )}

      {/* Modal de confirmación de edición masiva */}
      <Modal
        open={showBulkEdit}
        onClose={() => !bulkEditLoading && setShowBulkEdit(false)}
        title="Confirmar edición masiva"
        actions={
          <>
            <button
              className={styles.deleteBtn}
              onClick={async () => {
                setBulkEditLoading(true);
                try {
                  await Promise.all(selectedIds.map((id: string) => updateCategory(id, bulkEditData)));
                  showNotification('success', 'Categorías actualizadas correctamente');
                  clearSelection();
                  refreshCategories({ q: selectedSuggestion || debouncedSearch, page, limit });
                  setShowBulkEdit(false);
                } catch (err: any) {
                  showNotification('error', err?.message || 'Error al editar categorías');
                } finally {
                  setBulkEditLoading(false);
                }
              }}
              disabled={bulkEditLoading}
              style={{ minWidth: 100 }}
            >
              {bulkEditLoading ? 'Editando...' : 'Confirmar'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowBulkEdit(false)}
              disabled={bulkEditLoading}
              style={{ minWidth: 100 }}
            >Cancelar</button>
          </>
        }
        disableClose={bulkEditLoading}
      >
        <p>¿Estás seguro de que querés editar {selectedIds.length} categorías?</p>
      </Modal>
    </div>
  );
}
