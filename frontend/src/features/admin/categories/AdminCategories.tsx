import { CategoriesPagination } from './components/CategoriesPagination';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeSlideIn } from './animationConfig';
// import type { Category } from './types/category';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useNotification } from '../../../context/NotificationContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useCategorySelection } from './hooks/useCategorySelection';
import { BulkEditCategoriesBar } from './BulkEditCategoriesBar';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FolderSearch, AlertCircle, Grid3x3, List } from 'lucide-react';
import { CategoriesGrid } from './CategoriesGrid';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminCategories.module.css';
import { CategoriesHeader } from './components/CategoriesHeader';
import { exportCategoriesToCSV, exportCategoriesToExcel } from './utils/exportCategories';
import { CategoriesFilters } from './components/CategoriesFilters';
// import { CategorySearchInput } from '../../../components/ui/CategorySearchInput';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useCategoryBulkActions } from './hooks/useCategoryBulkActions';
import { logAdminActivity } from '../../../services/adminActivityLogService';

type CategorySortField = 'name' | 'slug' | 'itemCount' | 'isVisible';
type CategorySortDirection = 'asc' | 'desc';


export function AdminCategories() {
  const { categories, isLoading: loading, error, refreshCategories, totalPages: apiTotalPages, total, addCategory, updateCategory, deleteCategory, uploadCategoryImage } = useAdminCategories();
  // Local state for pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Could be made configurable
  const { can, user } = useAdminAuth();
  const [search, setSearch] = useState('');
  // Para UX: si el usuario selecciona una sugerencia, forzar búsqueda exacta
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<CategorySortField>('name');
  const [sortDirection, setSortDirection] = useState<CategorySortDirection>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('adminCategoriesViewMode');
    return saved === 'list' ? 'list' : 'grid';
  });
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    localStorage.setItem('adminCategoriesViewMode', viewMode);
  }, [viewMode]);


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
      parentId: category?.parentId ?? '',
      isVisible: category?.isVisible ?? true,
    });
    setFormImageFile(null);
    setFormImagePreview(category?.image ?? '');
    setShowForm(true);
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
  // const auth = useAdminAuth ? useAdminAuth() : null;
  // const userEmail = (auth && (auth.user as any)?.email) || 'desconocido';

  // Eliminar categoría con confirmación y feedback
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

  // Pasar estado optimista a las categorías
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
  const someVisibleSelected = categoriesWithOptimism.some(cat => selectedIds.includes(cat.id));
  const hasChildren = editId ? categories.some((cat) => cat.parentId === editId) : false;
  const parentOptions = categories.filter((cat) => !cat.parentId && cat.id !== editId);

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

      {!loading && !error && categories.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            marginTop: 8,
            marginBottom: 8,
            padding: '8px 12px',
            background: '#fafaf8',
            borderRadius: 10,
            border: '1px solid #e5e2dd',
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className={styles.exportBtn} onClick={handleExportCSV} type="button">
              Exportar CSV
            </button>
            <button className={styles.exportBtn} onClick={handleExportExcel} type="button">
              Exportar Excel
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', background: '#fff', borderRadius: 8, border: '1px solid #e5e2dd' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ordenar:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as CategorySortField)}
                style={{ padding: '5px 6px', borderRadius: 6, border: '1px solid #e5e2dd', background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <option value="name">Nombre</option>
                <option value="slug">Slug</option>
                <option value="itemCount">Productos</option>
                <option value="isVisible">Estado</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e2dd', background: sortDirection === 'asc' ? '#769282' : '#fff', color: sortDirection === 'asc' ? '#fff' : '#666', cursor: 'pointer', fontWeight: 600, fontSize: 11, transition: 'all 0.2s', minWidth: 35 }}
                title={`Ordenar ${sortDirection === 'asc' ? 'descendente' : 'ascendente'}`}
                type="button"
              >
                {sortDirection === 'asc' ? '▲' : '▼'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 4, border: '1px solid #e5e2dd', borderRadius: 8, padding: '4px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: viewMode === 'grid' ? '#769282' : '#fff',
                  color: viewMode === 'grid' ? '#fff' : '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: viewMode === 'grid' ? 600 : 500,
                  transition: 'all 200ms'
                }}
                title="Vista en cuadrícula"
                aria-pressed={viewMode === 'grid'}
                type="button"
              >
                <Grid3x3 size={16} /> Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: viewMode === 'list' ? '#769282' : '#fff',
                  color: viewMode === 'list' ? '#fff' : '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: viewMode === 'list' ? 600 : 500,
                  transition: 'all 200ms'
                }}
                title="Vista en lista"
                aria-pressed={viewMode === 'list'}
                type="button"
              >
                <List size={16} /> Lista
              </button>
            </div>
          </div>
        </div>
      )}

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
        ) : viewMode === 'grid' ? (
          <CategoriesGrid
            key="grid"
            categories={sortedCategories}
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
        ) : (
          <motion.div
            key="list"
            variants={fadeSlideIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <div
              style={{
                overflowX: 'auto',
                border: '1px solid #e5e2dd',
                borderRadius: 12,
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #f8f6f3 0%, #faf8f5 100%)', borderBottom: '2px solid #e5e2dd' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a1a1a' }}>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={(e) => handleSelectAllVisible(e.target.checked)}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = someVisibleSelected && !allVisibleSelected;
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                        aria-label="Seleccionar todas las categorías visibles"
                      />
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a1a1a' }}>Nombre</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a1a1a' }}>Slug</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>Productos</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map((cat, idx) => {
                    const categoryName = cat.name?.trim() || cat.slug;

                    return (
                      <tr key={cat.id} style={{ borderBottom: '1px solid #f0ede8', background: idx % 2 === 0 ? '#fff' : '#f9f7f4' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(cat.id)}
                            onChange={(e) => handleSelectCategory(cat.id, e.target.checked)}
                            style={{ cursor: 'pointer' }}
                            aria-label={`Seleccionar categoría ${categoryName}`}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', color: '#1a1a1a', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {cat.image ? (
                              <img src={cat.image} alt={categoryName} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: 4, background: '#ece9e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8478', fontSize: 10 }}>N/A</div>
                            )}
                            <span>{categoryName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#767676', fontSize: 12 }}>{cat.slug}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: 4,
                              background: (cat.itemCount ?? 0) > 0 ? '#d4edda' : '#f8d7da',
                              color: (cat.itemCount ?? 0) > 0 ? '#155724' : '#721c24',
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            {cat.itemCount ?? 0}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: 4,
                              background: cat.isVisible ? '#d4edda' : '#f8d7da',
                              color: cat.isVisible ? '#155724' : '#721c24',
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            {cat.isVisible ? 'Visible' : 'Oculta'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            {can('categories.edit') && (
                              <button
                                onClick={() => handleEdit(cat.id)}
                                style={{
                                  padding: '4px 8px',
                                  background: '#769282',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: 500
                                }}
                                type="button"
                              >
                                Editar
                              </button>
                            )}
                            {can('categories.edit') && (
                              <button
                                onClick={() => handleToggleVisibility(cat.id, !cat.isVisible)}
                                style={{
                                  padding: '4px 8px',
                                  background: cat.isVisible ? '#c46d2e' : '#3b82f6',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: 500
                                }}
                                type="button"
                              >
                                {cat.isVisible ? 'Ocultar' : 'Mostrar'}
                              </button>
                            )}
                            {can('categories.delete') && (
                              <button
                                onClick={() => setDeleteConfirm(cat.id)}
                                style={{
                                  padding: '4px 8px',
                                  background: '#c75050',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: 500
                                }}
                                type="button"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
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
              style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '10px 12px' }}
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
              style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '10px 12px', resize: 'vertical' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Categoría padre</span>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value }))}
              disabled={formSubmitting || hasChildren}
              style={{ borderRadius: 8, border: '1px solid #d1d5db', padding: '10px 12px' }}
            >
              <option value="">Sin categoría padre</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {hasChildren && (
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                Esta categoría ya tiene subcategorías, no puede asignarse como hija.
              </span>
            )}
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Imagen</span>
            <input
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
            >
              {bulkActionLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => closeBulkAction()}
              disabled={bulkActionLoading}
              style={{ minWidth: 100 }}
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
            >
              {bulkActionLoading ? 'Guardando...' : 'Confirmar'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => closeBulkAction()}
              disabled={bulkActionLoading}
              style={{ minWidth: 100 }}
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
