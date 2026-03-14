import React, { useState, useRef, useEffect } from 'react';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
// import { useNavigate } from 'react-router-dom';

// Utilidad para mantener selección entre páginas
function usePersistentSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const add = (ids: string[]) => setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
  const remove = (ids: string[]) => setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const clear = () => setSelectedIds([]);
  return { selectedIds, add, remove, toggle, clear, setSelectedIds };
}
import toast from 'react-hot-toast';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import type { StatusFilter, StockLevelFilter } from './productsService';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AdminProductForm } from './AdminProductForm';
import { AdminProductCard } from './AdminProductCard';
import { BulkEditBar } from './BulkEditBar';
import * as productsService from './productsService';
import { EmptyState } from '../../../components/ui/EmptyState';
import { PackageSearch, AlertCircle } from 'lucide-react';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { ProductHeader } from '../../../components/ui/ProductHeader';
import { ProductFilters } from '../../../components/ui/ProductFilters';
import { ProductCheckboxGeneral } from '../../../components/ui/ProductCheckboxGeneral';
import { ProductFeedbackSection } from '../../../components/ui/ProductFeedbackSection';
import { ProductCardsGrid } from '../../../components/ui/ProductCardsGrid';
import { ProductPagination } from '../../../components/ui/ProductPagination';

import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminProducts.module.css';
import { exportProductsToCSV, exportProductsToExcel } from '../../../utils/exportProducts';
import type { ExportableProduct } from '../../../utils/exportProducts';

export function AdminProducts() {
    // Edición masiva
    const [bulkEditLoading, setBulkEditLoading] = useState(false);
    const [bulkEditSuccess, setBulkEditSuccess] = useState<string | null>(null);
    const [bulkEditError, setBulkEditError] = useState<string | null>(null);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [bulkEditData, setBulkEditData] = useState<{ price?: number; stock?: number; inStock?: boolean } | null>(null);
      const [isLoading] = useState<boolean>(false);

    // Simular obtención de token (ajustar según contexto real)
    const token = localStorage.getItem('token') || '';

    // Handler para aplicar edición masiva
    const handleBulkEdit = (data: { price?: number; stock?: number; inStock?: boolean }) => {
      setBulkEditData(data);
      setShowBulkConfirm(true);
    };

    // Confirmar y ejecutar edición masiva
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
      } catch (err: any) {
        setBulkEditError('Error al actualizar productos. Intenta nuevamente.');
      } finally {
        setBulkEditLoading(false);
        setShowBulkConfirm(false);
        setBulkEditData(null);
      }
    };

    // Cancelar edición masiva
    const cancelBulkEdit = () => {
      setBulkEditData(null);
      setShowBulkConfirm(false);
    };
  const { products, deleteProduct, loading, error, refreshProducts, page: apiPage, totalPages: apiTotalPages, total } = useAdminProducts();
  const { can } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<StockLevelFilter>('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const resetUnsavedChangesFn = () => {};
  // Hook para advertencia de cambios sin guardar
  const {
    showWarning,
    interceptNavigation,
    confirmExit,
    cancelExit,
  } = useUnsavedChangesWarning({
    active: unsavedChanges,
    onConfirmExit: () => {
      resetUnsavedChangesFn();
      setUnsavedChanges(false);
      setShowForm(false);
      setEditId(null);
    },
  });

  const { categories } = useAdminCategories();

  // Selección múltiple
  const {
    selectedIds,
    add,
    remove,
    clear
  } = usePersistentSelection();

  // Determinar si todos los productos visibles están seleccionados
  const allVisibleSelected = products.length > 0 && products.every(p => selectedIds.includes(p.id));
  const someVisibleSelected = products.some(p => selectedIds.includes(p.id));

  // Handler para checkbox general
  const handleSelectAllVisible = (checked: boolean) => {
    const visibleIds = products.map(p => p.id);
    if (checked) {
      add(visibleIds);
    } else {
      remove(visibleIds);
    }
  };

  // Handler para checkbox individual
  const handleSelectProduct = (id: string, checked: boolean) => {
    if (checked) {
      add([id]);
    } else {
      remove([id]);
    }
  };

  // Debounce para búsqueda
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

  const handlePageChange = (newPage: number) => {
    refreshProducts({
      q: search,
      categoryId: categoryFilter,
      status: statusFilter,
      stockLevel: stockLevelFilter,
      page: newPage,
      limit: 10
    });
  };

  // Sugerencias para autocompletado (usamos los productos ya cargados como base)
  const suggestions = search.length > 0
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleNew = () => {
    if (unsavedChanges) {
      interceptNavigation(() => {
        setEditId(null);
        setShowForm(true);
      });
    } else {
      setEditId(null);
      setShowForm(true);
    }
  };
  const handleEdit = (id: string) => {
    if (unsavedChanges) {
      interceptNavigation(() => {
        setEditId(id);
        setShowForm(true);
      });
    } else {
      setEditId(id);
      setShowForm(true);
    }
  };
    // Interceptar navegación por router v6
  const handleDelete = (id: string) => {
    try {
      deleteProduct(id);
      toast.success('Producto eliminado con éxito');
      setDeleteConfirm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${message}`);
    }
  };



  // Mapeo de productos visibles a formato exportable
  const exportableProducts: ExportableProduct[] = products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category?.name || '',
    price: p.price,
    discount: p.discount,
    stock: p.stock,
    inStock: p.inStock,
    createdAt: (p as any).createdAt || '',
  }));

  // Feedback para exportación vacía
  const handleExportCSV = () => {
    if (!exportableProducts.length) {
      toast.error('No hay productos para exportar.');
      return;
    }
    exportProductsToCSV(exportableProducts);
  };
  const handleExportExcel = () => {
    if (!exportableProducts.length) {
      toast.error('No hay productos para exportar.');
      return;
    }
    exportProductsToExcel(exportableProducts);
  };

  return (
    <main className={sectionStyles.page} aria-label="Gestión de productos">
      {/* Header + Exportación */}
        <ProductHeader canCreate={can('products.create')} onNew={handleNew} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="export-btn" onClick={handleExportCSV} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #8fa99a', background: '#fff', cursor: 'pointer' }}>Exportar CSV</button>
          <button className="export-btn" onClick={handleExportExcel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #8fa99a', background: '#fff', cursor: 'pointer' }}>Exportar Excel</button>
      </div>
      {/* Filtros */}
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


      {/* Panel de edición masiva */}
      {selectedIds.length > 0 && can('products.edit') && (
        <BulkEditBar
          selectedCount={selectedIds.length}
          onBulkEdit={handleBulkEdit}
          onCancel={clear}
          loading={bulkEditLoading}
        />
      )}

      {/* Mensajes de feedback */}
      <ProductFeedbackSection success={bulkEditSuccess} error={bulkEditError} />

      {/* Modal de confirmación de edición masiva */}
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
      {products.length > 0 && (can('products.edit') || can('products.delete')) && (
        <ProductCheckboxGeneral
          checked={allVisibleSelected}
          indeterminate={someVisibleSelected && !allVisibleSelected}
          onChange={handleSelectAllVisible}
        />
      )}
      {(loading || isLoading) && (
        <section className={styles.cardsGrid} aria-label="Listado de productos">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </section>
      )}

      {!loading && !isLoading && error && (
        <EmptyState
          icon={<AlertCircle size={48} color="#ef4444" />}
          title="Error al cargar productos"
          description={error}
          action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
        />
      )}

      {!loading && !isLoading && !error && (products.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={48} color="#94a3b8" />}
          title="No se encontraron productos"
          description={search || categoryFilter
            ? "Probá ajustando los filtros o la búsqueda para encontrar lo que necesitás."
            : "Todavía no cargaste ningún producto al catálogo. ¡Empezá ahora!"
          }
          action={can('products.create') ? { label: 'Nuevo Producto', onClick: handleNew } : undefined}
        />
      ) : (
        <ProductCardsGrid>
          {products.map(p => (
            <AdminProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              sku={p.sku}
              price={p.price}
              discount={p.discount}
              stock={p.stock}
              inStock={p.inStock}
              image={p.images && p.images[0]}
              category={p.category?.name || ''}
              canEdit={can('products.edit')}
              canDelete={can('products.delete')}
              onEdit={handleEdit}
              onDelete={() => setDeleteConfirm(p.id)}
              selected={selectedIds.includes(p.id)}
              onSelectChange={handleSelectProduct}
              showCheckbox={can('products.edit') || can('products.delete')}
            />
          ))}
        </ProductCardsGrid>
      ))}

      {/* Controles de paginación */}
      {total > 10 && (
        <ProductPagination
          page={apiPage}
          totalPages={apiTotalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal de formulario */}
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
      {/* Modal de advertencia de cambios sin guardar */}
      {showWarning && (
        <ModalConfirm
          open={showWarning}
          title="Tienes cambios sin guardar"
          message="¿Seguro que deseas salir? Los cambios se perderán."
          confirmText="Salir sin guardar"
          cancelText="Cancelar"
          onConfirm={confirmExit}
          onCancel={cancelExit}
        />
      )}

      {/* Modal de confirmación de eliminación */}
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

// Skeleton visual para cards
function SkeletonCard() {
  return (
    <div className={styles.card} style={{ minHeight: 220 }}>
      <div className={styles.imageWrapper}>
        <div style={{ width: '100%', height: '100%', background: '#ececec', animation: 'pulse 1.2s infinite', borderRadius: 10 }} />
      </div>
      <div className={styles.info}>
        <div className={styles.headerRow}>
          <div style={{ width: '60%', height: 16, background: '#ececec', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.2s infinite' }} />
          <div style={{ width: '40%', height: 12, background: '#ececec', borderRadius: 4, animation: 'pulse 1.2s infinite' }} />
        </div>
        <div style={{ width: '30%', height: 12, background: '#ececec', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.2s infinite' }} />
        <div style={{ width: '50%', height: 14, background: '#ececec', borderRadius: 4, animation: 'pulse 1.2s infinite' }} />
      </div>
    </div>
  );
}
