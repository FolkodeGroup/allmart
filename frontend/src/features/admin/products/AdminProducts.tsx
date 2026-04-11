import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import type { StatusFilter, StockLevelFilter } from './productsService';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { useScrollPreserver } from '../../../utils/tableScrollPreserver';

// Components
import { AdminProductForm } from './AdminProductForm';
import { MasterDetailLayout } from './MasterDetailLayout';
import { BulkEditBar } from './BulkEditBar';
import * as productsService from './productsService';

// UI Components
import { EmptyState } from '../../../components/ui/EmptyState';
import { PackageSearch, AlertCircle } from 'lucide-react';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { ProductHeader } from '../../../components/ui/ProductHeader';
import { ProductFilters } from '../../../components/ui/ProductFilters';
import { ProductFeedbackSection } from '../../../components/ui/ProductFeedbackSection';
import { ProductPagination } from '../../../components/ui/ProductPagination';

// Styles
import sectionStyles from '../shared/AdminSection.module.css';

// Utils

// Utility for maintaining selection across pages
function usePersistentSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const add = (ids: string[]) => setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
  const remove = (ids: string[]) => setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const clear = () => setSelectedIds([]);
  return { selectedIds, add, remove, toggle, clear, setSelectedIds };
}

export function AdminProducts() {
  // === STATE MANAGEMENT ===

  // Bulk editing
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [bulkEditSuccess, setBulkEditSuccess] = useState<string | null>(null);
  const [bulkEditError, setBulkEditError] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<{ price?: number; stock?: number; inStock?: boolean } | null>(null);

  // Form management
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const resetUnsavedChangesFn = () => { };

  // Filters and search
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<StockLevelFilter>('all');

  // Context and hooks
  const { products, deleteProduct, loading, error, refreshProducts, page: apiPage, totalPages: apiTotalPages, total } = useAdminProducts();
  const { can } = useAdminAuth();
  const { categories } = useAdminCategories();
  const token = localStorage.getItem('token') || '';

  // Selection management
  const {
    selectedIds,
    add,
    remove,
    clear
  } = usePersistentSelection();

  // Scroll preservation
  const containerRef = useRef<HTMLElement>(null);
  useScrollPreserver(containerRef as React.RefObject<HTMLElement>, 'products-master-detail', [apiPage, search, categoryFilter, statusFilter, stockLevelFilter]);

  // Unsaved changes warning
  const {
    showWarning,
    interceptNavigation,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChangesWarning({
    active: unsavedChanges,
    onConfirmExit: () => {
      resetUnsavedChangesFn();
      setUnsavedChanges(false);
      setShowForm(false);
      setEditId(null);
    },
  });

  // === SELECTION LOGIC ===

  const handleSelectProduct = useCallback((id: string, checked: boolean) => {
    if (checked) {
      add([id]);
    } else {
      remove([id]);
    }
  }, [add, remove]);

  // === SEARCH AND FILTER LOGIC ===

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshProducts({
        q: search,
        categoryId: categoryFilter,
        status: statusFilter,
        stockLevel: stockLevelFilter,
        page: 1,
        limit: 10
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter, stockLevelFilter, refreshProducts]);

  const handlePageChange = useCallback((newPage: number) => {
    refreshProducts({
      q: search,
      categoryId: categoryFilter,
      status: statusFilter,
      stockLevel: stockLevelFilter,
      page: newPage,
      limit: 10
    });
  }, [search, categoryFilter, statusFilter, stockLevelFilter, refreshProducts]);

  // Suggestions for autocomplete
  const suggestions = useMemo(() => search.length > 0
    ? products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8)
    : [], [search, products]);

  // === FORM/EDIT HANDLERS ===

  const handleNew = useCallback(() => {
    if (unsavedChanges) {
      interceptNavigation(() => {
        setEditId(null);
        setShowForm(true);
      });
    } else {
      setEditId(null);
      setShowForm(true);
    }
  }, [unsavedChanges, interceptNavigation]);

  const handleEdit = useCallback((id: string) => {
    if (unsavedChanges) {
      interceptNavigation(() => {
        setEditId(id);
        setShowForm(true);
      });
    } else {
      setEditId(id);
      setShowForm(true);
    }
  }, [unsavedChanges, interceptNavigation]);

  const handleDelete = useCallback((id: string) => {
    try {
      deleteProduct(id);
      toast.success('Producto eliminado con éxito');
      setDeleteConfirm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${message}`);
    }
  }, [deleteProduct]);

  // === BULK EDIT HANDLERS ===

  const handleBulkEdit = (data: { price?: number; stock?: number; inStock?: boolean }) => {
    setBulkEditData(data);
    setShowBulkConfirm(true);
  };

  const confirmBulkEdit = async () => {
    if (!bulkEditData) return;
    setBulkEditLoading(true);
    setBulkEditSuccess(null);
    setBulkEditError(null);
    try {
      await Promise.all(selectedIds.map(id =>
        productsService.updateAdminProduct(id, bulkEditData, token)
      ));
      setBulkEditSuccess('¡Productos actualizados correctamente!');
      clear();
      refreshProducts({ q: search, categoryId: categoryFilter, page: apiPage, limit: 10 });
    } catch {
      setBulkEditError('Error al actualizar productos. Intenta nuevamente.');
    } finally {
      setBulkEditLoading(false);
      setShowBulkConfirm(false);
      setBulkEditData(null);
    }
  };

  const cancelBulkEdit = () => {
    setBulkEditData(null);
    setShowBulkConfirm(false);
  };

  // === EXPORT HANDLERS ===

  // (Export handlers can be added back if needed in the MasterDetailLayout toolbar)

  // === RENDER ===

  return (
    <main
      ref={containerRef}
      className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`}
      aria-label="Gestión de productos"
    >
      {/* Header */}
      <ProductHeader canCreate={can('products.create')} onNew={handleNew} />

      {/* Filters */}
      <ProductFilters
        search={search}
        setSearch={setSearch}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        highlightedIndex={highlightedIndex}
        setHighlightedIndex={setHighlightedIndex}
        inputRef={inputRef as React.RefObject<HTMLInputElement>}
        suggestions={suggestions}
        onSelectSuggestion={name => {
          setSearch(name);
          setShowSuggestions(false);
          setHighlightedIndex(-1);
        }}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stockLevelFilter={stockLevelFilter}
        setStockLevelFilter={setStockLevelFilter}
        total={total}
      />

      {/* Bulk Edit Bar */}
      {selectedIds.length > 0 && can('products.edit') && (
        <BulkEditBar
          selectedCount={selectedIds.length}
          onBulkEdit={handleBulkEdit}
          onCancel={clear}
          loading={bulkEditLoading}
        />
      )}

      {/* Feedback Messages */}
      <ProductFeedbackSection success={bulkEditSuccess} error={bulkEditError} />

      {/* Bulk Edit Confirmation Modal */}
      {showBulkConfirm && (
        <ModalConfirm
          open={showBulkConfirm}
          title="Confirmar edición masiva"
          message={`¿Aplicar los cambios a ${selectedIds.length} productos seleccionados? Esta acción no se puede deshacer.`}
          confirmText="Aplicar cambios"
          cancelText="Cancelar"
          onConfirm={confirmBulkEdit}
          onCancel={cancelBulkEdit}
        />
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle size={48} color="#ef4444" />}
          title="Error al cargar productos"
          description={error}
          action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
        />
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <EmptyState
          icon={<PackageSearch size={48} color="#94a3b8" />}
          title="No se encontraron productos"
          description={
            search || categoryFilter
              ? "Probá ajustando los filtros o la búsqueda para encontrar lo que necesitás."
              : "Todavía no cargaste ningún producto al catálogo. ¡Empezá ahora!"
          }
          action={
            can('products.create')
              ? { label: 'Nuevo Producto', onClick: handleNew }
              : undefined
          }
        />
      )}

      {/* Master-Detail Layout */}
      {!loading && !error && products.length > 0 && (
        <>
          <MasterDetailLayout
            products={products}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelectChange={handleSelectProduct}
            onEdit={can('products.edit') ? handleEdit : undefined}
            onDelete={can('products.delete') ? handleDelete : undefined}
            canEdit={can('products.edit')}
            canDelete={can('products.delete')}
            showCheckbox={can('products.edit') || can('products.delete')}
          />

          {/* Pagination */}
          {total > 10 && (
            <ProductPagination
              page={apiPage}
              totalPages={apiTotalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <AdminProductForm
          productId={editId}
          onClose={() => {
            if (unsavedChanges) {
              interceptNavigation(() => setShowForm(false));
            } else {
              setShowForm(false);
            }
          }}
          onUnsavedChanges={setUnsavedChanges}
          resetUnsavedChanges={resetUnsavedChangesFn}
        />
      )}

      {/* Unsaved Changes Warning Modal */}
      {showWarning && (
        <ModalConfirm
          open={showWarning}
          title="Tienes cambios sin guardar"
          message="¿Seguro que deseas salir? Los cambios se perderán."
          confirmText="Salir sin guardar"
          cancelText="Cancelar"
          onConfirm={confirmNavigation}
          onCancel={cancelNavigation}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ModalConfirm
        open={!!deleteConfirm}
        title="Eliminar producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </main>
  );
}
