import { motion, AnimatePresence } from 'framer-motion';
import { fadeSlideIn } from './animationConfig';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';
import { useNotification } from '../../../context';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useCategorySelection } from './hooks/useCategorySelection';
import { BulkEditCategoriesBar } from './BulkEditCategoriesBar';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FolderSearch, AlertCircle } from 'lucide-react';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminCategories.module.css';
import { CategoriesHeader } from './components/CategoriesHeader';
import { exportCategoriesToCSV, exportCategoriesToExcel, exportCategoriesToPDF } from './utils/exportCategories';
import { ExportButtons } from '../../../components/ui/ExportButtons';
import type { ExportFormat } from '../../../components/ui/ExportButtons';
import { CategoriesFilters } from './components/CategoriesFilters';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useCategoryBulkActions } from './hooks/useCategoryBulkActions';
import { logAdminActivity } from '../../../services/adminActivityLogService';
import { CategoriesMasterDetailLayout } from './CategoriesMasterDetailLayout';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';

type CategorySortField = 'name' | 'slug' | 'itemCount' | 'isVisible';
type CategorySortDirection = 'asc' | 'desc';

export function AdminCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categories, isLoading: loading, error, refreshCategories, totalPages: apiTotalPages, total, addCategory, updateCategory, deleteCategory, uploadCategoryImage } = useAdminCategories();

  // Estado local para paginación
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { can, user } = useAdminAuth();
  const [search, setSearch] = useState('');

  // Para UX: si el usuario selecciona una sugerencia, forzar búsqueda exacta
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<CategorySortField>('name');
  const [sortDirection, setSortDirection] = useState<CategorySortDirection>('asc');
  const [_deleting, setDeleting] = useState(false); //deleting ocultado porque no tiene un uso todavia
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    isVisible: true,
  });

  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>('');

  // Estado para cambio de visibilidad
  const [toggleConfirm, setToggleConfirm] = useState<{ id: string; newVisible: boolean } | null>(null);
  const [_togglingId, setTogglingId] = useState<string | null>(null); //togglingId ocultado porque no tiene un uso todavia
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

  // Estado y lógica para acciones masivas (extraído a hook personalizado)
  const {
    bulkActionLoading,
    setBulkActionLoading,
    bulkAction,
    setBulkAction,
    handleDeleteBulk,
    handleToggleVisibilityBulk,
    closeBulkAction
  } = useCategoryBulkActions();

  // Opciones de ordenamiento para el Dropdown unificado
  const sortOptions = useMemo(() => [
    { value: 'name', label: 'Nombre' },
    { value: 'slug', label: 'Slug' },
    { value: 'itemCount', label: 'Productos' },
    { value: 'isVisible', label: 'Estado' }
  ], []);

  // Fetch categories cuando los filtros cambian
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

  // Cuando se regresa a la página, refetch para mostrar cambios
  useEffect(() => {
    refreshCategories({
      q: selectedSuggestion || debouncedSearch,
      page,
      limit,
      minProducts: minProducts === '' ? undefined : minProducts,
      maxProducts: maxProducts === '' ? undefined : maxProducts,
      isVisible: isVisible === 'all' ? undefined : isVisible === 'visible' ? true : false,
    });
  }, [location.pathname, debouncedSearch, selectedSuggestion, page, limit, minProducts, maxProducts, isVisible, refreshCategories]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const resetFormState = () => {
    setFormError(null);
    setFormSubmitting(false);
    setFormData({
      name: '',
      description: '',
      parentId: '',
      isVisible: true,
    });
    setFormImageFile(null);
    setFormImagePreview('');
  };

  const closeForm = () => {
    if (formSubmitting) return;
    setShowForm(false);
    setEditId(null);
    resetFormState();
  };

  const handleNew = () => {
    navigate('/admin/categories/nueva');
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/categories/${id}/editar`);
  };

  const validateImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return 'Seleccioná un archivo de imagen válido.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'La imagen no puede superar los 5 MB.';
    }
    return null;
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const fileError = validateImageFile(file);
    if (fileError) {
      setFormError(fileError);
      showNotification('error', fileError);
      event.target.value = '';
      return;
    }

    setFormError(null);
    setFormImageFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const slugifyCategoryName = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const handleSubmitCategoryForm = async (event: FormEvent<HTMLFormElement>) => {
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
      parentId: formData.parentId || null,
      isVisible: formData.isVisible,
    };

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editId) {
        await updateCategory(editId, payload);
        logAdminActivity({
          timestamp: new Date().toISOString(),
          user: user || 'desconocido',
          action: 'edit',
          entity: 'category',
          entityId: editId,
          details: { ...payload },
        });
        if (formImageFile) {
          await uploadCategoryImage(editId, formImageFile);
        }
      } else {
        const createdCategory = await addCategory({
          ...payload,
          slug: slugifyCategoryName(trimmedName),
          itemCount: 0,
        });
        logAdminActivity({
          timestamp: new Date().toISOString(),
          user: user || 'desconocido',
          action: 'create',
          entity: 'category',
          entityId: createdCategory.id,
          details: { ...payload },
        });
        if (formImageFile) {
          await uploadCategoryImage(createdCategory.id, formImageFile);
        }
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
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la categoría.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteCategory(id);
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: user || 'desconocido',
        action: 'delete',
        entity: 'category',
        entityId: id,
        details: {},
      });
      showNotification('success', 'Categoría eliminada correctamente');
      refreshCategories({ q: selectedSuggestion || debouncedSearch, page, limit });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la categoría';
      showNotification('error', msg);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleToggleVisibility = (id: string, newVisible: boolean) => {
    setToggleConfirm({ id, newVisible });
  };

  const confirmToggleVisibility = async () => {
    if (!toggleConfirm) return;
    const { id, newVisible } = toggleConfirm;
    setTogglingId(id);
    setOptimisticVis(prev => ({ ...prev, [id]: newVisible }));
    try {
      await updateCategory(id, { isVisible: newVisible });
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: user || 'desconocido',
        action: 'edit',
        entity: 'category',
        entityId: id,
        details: { isVisible: newVisible },
      });
      showNotification('success', newVisible ? 'Categoría visible' : 'Categoría oculta');
    } catch (err: unknown) {
      setOptimisticVis(prev => ({ ...prev, [id]: !newVisible }));
      showNotification('error', err instanceof Error ? err.message : 'Error al cambiar visibilidad');
    } finally {
      setTogglingId(null);
      setToggleConfirm(null);
      refreshCategories({ q: selectedSuggestion || debouncedSearch, page, limit });
    }
  };

  const categoriesWithOptimism = categories.map(cat =>
    optimisticVis[cat.id] !== undefined ? { ...cat, isVisible: optimisticVis[cat.id] } : cat
  );

  const sortedCategories = useMemo(() => {
    const ordered = [...categoriesWithOptimism];

    ordered.sort((a, b) => {
      let result = 0;

      switch (sortField) {
        case 'name':
          result = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
          break;
        case 'slug':
          result = a.slug.localeCompare(b.slug, 'es', { sensitivity: 'base' });
          break;
        case 'itemCount':
          result = (a.itemCount ?? 0) - (b.itemCount ?? 0);
          break;
        case 'isVisible':
          result = Number(a.isVisible) - Number(b.isVisible);
          break;
      }

      return sortDirection === 'asc' ? result : -result;
    });

    return ordered;
  }, [categoriesWithOptimism, sortField, sortDirection]);

  const hasChildren = editId ? categories.some((cat) => cat.parentId === editId) : false;
  const parentOptions = categories.filter((cat) => !cat.parentId && cat.id !== editId);

  // Mapeo de opciones de categoría padre para el Dropdown en el modal
  const parentCategoryOptions = useMemo(() => [
    { value: '', label: 'Sin categoría padre' },
    ...parentOptions.map((cat) => ({ value: cat.id, label: cat.name }))
  ], [parentOptions]);

  const [exportLoadingCat, setExportLoadingCat] = useState<ExportFormat | null>(null);

  const handleExportCSV = () => {
    if (!categoriesWithOptimism.length) {
      showNotification('info', 'No hay categorías para exportar.');
      return;
    }
    exportCategoriesToCSV(categoriesWithOptimism);
  };

  const handleExportExcel = async () => {
    if (!categoriesWithOptimism.length) {
      showNotification('info', 'No hay categorías para exportar.');
      return;
    }
    setExportLoadingCat('xlsx');
    try { await exportCategoriesToExcel(categoriesWithOptimism); } finally { setExportLoadingCat(null); }
  };

  const handleExportPDF = async () => {
    if (!categoriesWithOptimism.length) {
      showNotification('info', 'No hay categorías para exportar.');
      return;
    }
    setExportLoadingCat('pdf');
    try { await exportCategoriesToPDF(categoriesWithOptimism); } finally { setExportLoadingCat(null); }
  };

  return (
    <div className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`}>

      {/* Header */}
      <CategoriesHeader
        canCreate={can('categories.create')}
        onNew={handleNew}
      />

      {/* Filtros fuera del header */}
      <motion.div
        variants={fadeSlideIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
      >
        <CategoriesFilters
          search={search}
          setSearch={setSearch}
          total={total}
          minProducts={minProducts}
          setMinProducts={setMinProducts}
          maxProducts={maxProducts}
          setMaxProducts={setMaxProducts}
          isVisible={isVisible}
          setIsVisible={setIsVisible}
        />
      </motion.div>

      {!loading && !error && categories.length > 0 && (
        <div className={styles.actionsBar}>
          <div className={styles.exportBtnContainer}>
            <ExportButtons
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              loading={exportLoadingCat}
            />
          </div>

          <div className={styles.sortContainer}>
            <div className={styles.sortControls}>
              <span className={styles.sortLabel}>Ordenar:</span>
              <div style={{ width: '130px', display: 'inline-block' }}>
                <Dropdown
                  options={sortOptions}
                  value={sortField}
                  onChange={(val) => setSortField(val as CategorySortField)}
                  placeholder="Ordenar por..."
                />
              </div>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className={styles.sortButton}
                title={`Ordenar ${sortDirection === 'asc' ? 'descendente' : 'ascendente'}`}
                type="button"
              >
                {sortDirection === 'asc' ? '▲' : '▼'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <>
            <CategoriesMasterDetailLayout
              key="grid"
              categories={sortedCategories}
              onEdit={can('categories.edit') ? handleEdit : undefined}
              onDelete={can('categories.delete') ? (id => setDeleteConfirm(id)) : undefined}
              canEdit={can('categories.edit')}
              canDelete={can('categories.delete')}
              defaultSelectedCategoryId={selectedIds[0]}
              getProductCount={cat => cat.itemCount}
              onToggleVisibility={can('categories.edit') ? handleToggleVisibility : undefined}
              selectedIds={selectedIds}
              onSelect={handleSelectCategory}
              allSelected={allVisibleSelected}
              onSelectAll={handleSelectAllVisible}
            />
            {/* Controles de paginación */}
            <AdminPagination
              page={page}
              totalPages={apiTotalPages}
              onPageChange={handlePageChange}
              ariaLabel="Paginación de categorías"
            />
          </>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de visibilidad */}
      <ModalConfirm
        open={!!toggleConfirm}
        title={toggleConfirm?.newVisible ? 'Mostrar categoría' : 'Ocultar categoría'}
        description={toggleConfirm?.newVisible
          ? '¿Mostrar esta categoría? Será visible para los usuarios.'
          : '¿Ocultar esta categoría? No será visible para los usuarios.'}
        confirmText={toggleConfirm?.newVisible ? 'Mostrar' : 'Ocultar'}
        cancelText="Cancelar"
        onConfirm={confirmToggleVisibility}
        onCancel={() => setToggleConfirm(null)}
      />

      {/* Modal de confirmación de eliminación */}
      <ModalConfirm
        open={!!deleteConfirm}
        title="Eliminar categoría"
        description="¿Seguro que querés eliminar esta categoría?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Formulario en modal para creación rápida */}
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
              style={{ minWidth: 120, background: '#16a34a' }}
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

          <label style={{ display: 'grid', gap: 6 }} htmlFor="modal-category-name">
            <span style={{ fontWeight: 600 }}>Nombre *</span>
            <input
              id="modal-category-name"
              name="modalCategoryName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Herramientas"
              disabled={formSubmitting}
              required
              maxLength={80}
              style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '10px 12px' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }} htmlFor="modal-category-description">
            <span style={{ fontWeight: 600 }}>Descripción</span>
            <textarea
              id="modal-category-description"
              name="modalCategoryDescription"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción corta para la categoría"
              disabled={formSubmitting}
              rows={3}
              maxLength={280}
              style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '10px 12px', resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Categoría padre</span>
            <Dropdown
              id="modal-category-parent"
              options={parentCategoryOptions}
              value={formData.parentId}
              onChange={(val) => setFormData((prev) => ({ ...prev, parentId: val }))}
              disabled={formSubmitting || hasChildren}
              placeholder="Sin categoría padre"
            />
            {hasChildren && (
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                Esta categoría ya tiene subcategorías, no puede asignarse como hija.
              </span>
            )}
          </div>

          <label style={{ display: 'grid', gap: 6 }} htmlFor="modal-category-image">
            <span style={{ fontWeight: 600 }}>Imagen</span>
            <input
              id="modal-category-image"
              name="modalCategoryImage"
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              disabled={formSubmitting}
              style={{ borderRadius: 8, border: '1px dashed #9ca3af', padding: 10, background: '#f9fafb' }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Formatos permitidos: imagen. Tamaño máximo: 5 MB.
              {editId ? ' Si cargás un archivo nuevo, reemplaza la imagen actual.' : ''}
            </span>
          </label>

          {formImagePreview && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
              <img
                src={formImagePreview}
                alt="Vista previa de categoría"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: 8, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setFormImageFile(null);
                    setFormImagePreview('');
                  }}
                  disabled={formSubmitting}
                  style={{ minWidth: 100 }}
                >
                  Quitar imagen
                </button>
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }} htmlFor="modal-category-visible">
            <input
              id="modal-category-visible"
              name="modalCategoryVisible"
              type="checkbox"
              checked={formData.isVisible}
              onChange={(e) => setFormData((prev) => ({ ...prev, isVisible: e.target.checked }))}
              disabled={formSubmitting}
            />
            <span className={styles.checkboxLabel}>Visible en tienda</span>
          </label>
        </form>
      </Modal>

      {/* Barra de acciones masivas */}
      {!loading && !error && selectedIds.length > 0 && (
        <BulkEditCategoriesBar
          selectedCount={selectedIds.length}
          loading={bulkActionLoading}
          onToggleVisibility={handleToggleVisibilityBulk}
          onDelete={handleDeleteBulk}
          onCancel={() => clearSelection()}
        />
      )}

      {/* Modal de confirmación para eliminar masivamente */}
      <Modal
        open={bulkAction.type === 'delete'}
        onClose={() => !bulkActionLoading && closeBulkAction()}
        title="Eliminar categorías"
        actions={
          <>
            <button
              className={styles.deleteBtn}
              onClick={async () => {
                setBulkActionLoading(true);
                try {
                  await Promise.all(selectedIds.map((id: string) => deleteCategory(id)));
                  showNotification('success', `${selectedIds.length} categoría${selectedIds.length !== 1 ? 's' : ''} eliminada${selectedIds.length !== 1 ? 's' : ''} correctamente`);
                  clearSelection();
                  refreshCategories({ q: selectedSuggestion || debouncedSearch, page, limit });
                  setBulkAction({ type: null });
                } catch (err: unknown) {
                  showNotification('error', err instanceof Error ? err.message : 'Error al eliminar categorías');
                } finally {
                  setBulkActionLoading(false);
                }
              }}
              disabled={bulkActionLoading}
              style={{ minWidth: 100 }}
              type="button"
            >
              {bulkActionLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => closeBulkAction()}
              disabled={bulkActionLoading}
              style={{ minWidth: 100 }}
              type="button"
            >Cancelar</button>
          </>
        }
        disableClose={bulkActionLoading}
      >
        <p>¿Estás seguro de que querés eliminar {selectedIds.length} categoría{selectedIds.length !== 1 ? 's' : ''}? Esta acción no se puede deshacer.</p>
      </Modal>

      {/* Modal de confirmación para cambiar visibilidad masivamente */}
      <Modal
        open={bulkAction.type === 'visibility'}
        onClose={() => !bulkActionLoading && closeBulkAction()}
        title={bulkAction.visibilityValue ? 'Mostrar categorías' : 'Ocultar categorías'}
        actions={
          <>
            <button
              className={styles.deleteBtn}
              onClick={async () => {
                setBulkActionLoading(true);
                try {
                  await Promise.all(selectedIds.map((id: string) => updateCategory(id, { isVisible: bulkAction.visibilityValue })));
                  const action = bulkAction.visibilityValue ? 'mostrada' : 'oculta';
                  showNotification('success', `${selectedIds.length} categoría${selectedIds.length !== 1 ? 's' : ''} ${action}${selectedIds.length !== 1 ? 's' : ''} correctamente`);
                  clearSelection();
                  refreshCategories({ q: selectedSuggestion || debouncedSearch, page, limit });
                  setBulkAction({ type: null });
                } catch (err: unknown) {
                  showNotification('error', err instanceof Error ? err.message : 'Error al cambiar visibilidad de categorías');
                } finally {
                  setBulkActionLoading(false);
                }
              }}
              disabled={bulkActionLoading}
              style={{ minWidth: 100 }}
              type="button"
            >
              {bulkActionLoading ? 'Guardando...' : 'Confirmar'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => closeBulkAction()}
              disabled={bulkActionLoading}
              style={{ minWidth: 100 }}
              type="button"
            >Cancelar</button>
          </>
        }
        disableClose={bulkActionLoading}
      >
        <p>
          {bulkAction.visibilityValue
            ? `¿Mostrar ${selectedIds.length} categoría${selectedIds.length !== 1 ? 's' : ''}? Serán visibles para los usuarios.`
            : `¿Ocultar ${selectedIds.length} categoría${selectedIds.length !== 1 ? 's' : ''}? No serán visibles para los usuarios.`}
        </p>
      </Modal>
    </div>
  );
}