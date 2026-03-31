import { CategoriesPagination } from './components/CategoriesPagination';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeSlideIn } from './animationConfig';
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
  const { categories, isLoading: loading, error, refreshCategories, totalPages: apiTotalPages, total, addCategory, updateCategory, deleteCategory } = useAdminCategories();
  // Local state for pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Could be made configurable
  const { can } = useAdminAuth();
  const [search, setSearch] = useState('');
  // Para UX: si el usuario selecciona una sugerencia, forzar búsqueda exacta
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isVisible: true,
  });
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

  const resetFormState = () => {
    setFormError(null);
    setFormSubmitting(false);
    setFormData({
      name: '',
      description: '',
      image: '',
      isVisible: true,
    });
  };

  const closeForm = () => {
    if (formSubmitting) return;
    setShowForm(false);
    setEditId(null);
    resetFormState();
  };

  const handleNew = () => {
    setEditId(null);
    resetFormState();
    setShowForm(true);
  };

  const handleEdit = (id: string) => {
    const category = categories.find((cat) => cat.id === id);
    setEditId(id);
    setFormError(null);
    setFormSubmitting(false);
    setFormData({
      name: category?.name ?? '',
      description: category?.description ?? '',
      image: category?.image ?? '',
      isVisible: category?.isVisible ?? true,
    });
    setShowForm(true);
  };

  const slugifyCategoryName = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const handleSubmitCategoryForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formSubmitting) return;

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormError('El nombre es obligatorio.');
      showNotification('error', 'El nombre es obligatorio.');
      return;
    }

    const payload = {
      name: trimmedName,
      description: formData.description.trim() || undefined,
      image: formData.image.trim() || undefined,
      isVisible: formData.isVisible,
    };

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editId) {
        await updateCategory(editId, payload);
      } else {
        await addCategory({
          ...payload,
          slug: slugifyCategoryName(trimmedName),
          itemCount: 0,
        });
      }

      setShowForm(false);
      setEditId(null);
      resetFormState();
      refreshCategories({
        q: selectedSuggestion || debouncedSearch,
        page,
        limit,
        minProducts: minProducts === '' ? undefined : minProducts,
        maxProducts: maxProducts === '' ? undefined : maxProducts,
        isVisible: isVisible === 'all' ? undefined : isVisible === 'visible' ? true : false,
      });
    } catch (err: any) {
      setFormError(err?.message || 'No se pudo guardar la categoría.');
    } finally {
      setFormSubmitting(false);
    }
  };
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
        <motion.div
          variants={fadeSlideIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
        >
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
        </motion.div>

      {/* Tabla y feedback */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            variants={fadeSlideIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <LoadingSpinner message="Cargando categorías..." size="lg" />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            variants={fadeSlideIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <EmptyState
              icon={<AlertCircle size={48} color="#ef4444" />}
              title="Error al cargar categorías"
              description={error}
              action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
            />
          </motion.div>
        ) : categories.length === 0 ? (
          <motion.div
            key="empty"
            variants={fadeSlideIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <EmptyState
              icon={<FolderSearch size={48} color="#94a3b8" />}
              title="No se encontraron categorías"
              description={search
                ? "No hay resultados para tu búsqueda. Probá con otro término."
                : "Todavía no cargaste ninguna categoría al catálogo."
              }
              action={can('categories.create') ? { label: 'Nueva Categoría', onClick: handleNew } : undefined}
            />
          </motion.div>
        ) : (
          <CategoriesGrid
            key="grid"
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
        )}
      </AnimatePresence>

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
      <motion.div
        variants={fadeSlideIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
      >
        <CategoriesPagination
          page={page}
          totalPages={apiTotalPages}
          loading={loading}
          onPageChange={handlePageChange}
        />
      </motion.div>

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

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editId ? 'Editar categoría' : 'Nueva categoría'}
        actions={
          <>
            <button
              className={styles.deleteBtn}
              type="submit"
              form="admin-category-form"
              disabled={formSubmitting}
              style={{ minWidth: 120 }}
            >
              {formSubmitting ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
            </button>
            <button
              className={styles.cancelBtn}
              type="button"
              onClick={closeForm}
              disabled={formSubmitting}
              style={{ minWidth: 120 }}
            >
              Cancelar
            </button>
          </>
        }
        disableClose={formSubmitting}
      >
        <form id="admin-category-form" onSubmit={handleSubmitCategoryForm} style={{ display: 'grid', gap: 12 }}>
          {formError && (
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.92rem' }} role="alert">
              {formError}
            </p>
          )}

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Nombre *</span>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Herramientas"
              disabled={formSubmitting}
              required
              maxLength={80}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Descripción</span>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción corta para la categoría"
              disabled={formSubmitting}
              rows={3}
              maxLength={280}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>URL de imagen</span>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
              placeholder="https://..."
              disabled={formSubmitting}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={formData.isVisible}
              onChange={(e) => setFormData((prev) => ({ ...prev, isVisible: e.target.checked }))}
              disabled={formSubmitting}
            />
            Visible en tienda
          </label>
        </form>
      </Modal>

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
