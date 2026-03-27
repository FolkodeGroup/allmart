import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { useScrollPreserver } from '../../../utils/tableScrollPreserver';
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
import { Grid3x3, List } from 'lucide-react';

import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminProducts.module.css';

import { exportProductsToCSV, exportProductsToExcel } from '../../../utils/exportProducts';
import type { ExportableProduct } from '../../../utils/exportProducts';
import { sortProducts } from '../../../utils/sortProducts';
import type { SortField, SortDirection } from '../../../utils/sortProducts';

export function AdminProducts() {
  // Estado de ordenamiento
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Estado de vista (grid o lista)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('adminProductsViewMode');
    return (saved as 'grid' | 'list') || 'grid';
  });
  
  // Guardar preferencia de vista
  useEffect(() => {
    localStorage.setItem('adminProductsViewMode', viewMode);
  }, [viewMode]);

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
    } catch {
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
  const resetUnsavedChangesFn = () => { };

  // Ref para preservar scroll en cambios de página
  const containerRef = useRef<HTMLElement>(null);
  useScrollPreserver(containerRef as React.RefObject<HTMLElement>, 'products-list', [apiPage, search, categoryFilter, statusFilter, stockLevelFilter]);

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
  const handleSelectProduct = useCallback((id: string, checked: boolean) => {
    if (checked) {
      add([id]);
    } else {
      remove([id]);
    }
  }, [add, remove]);

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

  // Sugerencias para autocompletado (usamos los productos ya cargados como base)
  const suggestions = useMemo(() => search.length > 0
    ? products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8)
    : [], [search, products]);

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
  // Interceptar navegación por router v6
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



  // Mapeo de productos visibles a formato exportable
  const exportableProducts: (ExportableProduct & { sku?: string; image?: string })[] = useMemo(() => 
    products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || '',
      price: p.price,
      discount: p.discount,
      stock: p.stock,
      inStock: p.inStock,
      createdAt: (p as unknown as { createdAt: string }).createdAt || '',
      sku: p.sku,
      image: p.images && p.images[0],
    })), [products]);

  // Ordenar productos exportables para la vista
  const sortedProducts = useMemo(() => 
    sortProducts(exportableProducts, sortField, sortDirection),
    [exportableProducts, sortField, sortDirection]);

  // Feedback para exportación vacía
  const handleExportCSV = useCallback(() => {
    if (!exportableProducts.length) {
      toast.error('No hay productos para exportar.');
      return;
    }
    exportProductsToCSV(exportableProducts);
  }, [exportableProducts]);

  const handleExportExcel = useCallback(() => {
    if (!exportableProducts.length) {
      toast.error('No hay productos para exportar.');
      return;
    }
    exportProductsToExcel(exportableProducts);
  }, [exportableProducts]);

  return (
    <main
      ref={containerRef}
      className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`}
      aria-label="Gestión de productos"
    >
      {/* Header + Exportación + Vista */}
      <ProductHeader canCreate={can('products.create')} onNew={handleNew} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="export-btn" onClick={handleExportCSV} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #8fa99a', background: '#fff', cursor: 'pointer' }}>Exportar CSV</button>
          <button className="export-btn" onClick={handleExportExcel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #8fa99a', background: '#fff', cursor: 'pointer' }}>Exportar Excel</button>
        </div>
        <div style={{ display: 'flex', gap: 4, border: '1px solid #8fa99a', borderRadius: 8, padding: '4px', background: '#fff' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: viewMode === 'grid' ? '#769282' : 'transparent',
              color: viewMode === 'grid' ? '#fff' : '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: viewMode === 'grid' ? 600 : 400,
              transition: 'all 200ms'
            }}
            title="Vista en cuadrícula"
          >
            <Grid3x3 size={16} /> Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: viewMode === 'list' ? '#769282' : 'transparent',
              color: viewMode === 'list' ? '#fff' : '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: viewMode === 'list' ? 600 : 400,
              transition: 'all 200ms'
            }}
            title="Vista en lista"
          >
            <List size={16} /> Lista
          </button>
        </div>
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

      {/* Encabezados de columnas para ordenamiento */}
      <div className={styles.tableWrapper} >
        <div className={styles.table} >
          {[
            { label: 'Nombre', field: 'name' },
            { label: 'Precio', field: 'price' },
            { label: 'Stock', field: 'stock' },
            { label: 'Estado', field: 'inStock' },
            { label: 'Categoría', field: 'category' },
          ].map(col => (
            <button
              key={col.field}
              className={styles.th}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => {
                if (sortField === col.field) {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField(col.field as SortField);
                  setSortDirection('asc');
                }
              }}
              aria-label={`Ordenar por ${col.label}`}
            >
              {col.label}
              {sortField === col.field && (
                <span style={{ marginLeft: 2 }}>
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>


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
      ) : viewMode === 'grid' ? (
        <ProductCardsGrid>
          {sortedProducts.map(p => (
            <AdminProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              sku={p.sku}
              price={p.price}
              discount={p.discount}
              stock={p.stock}
              inStock={p.inStock}
              image={p.image}
              category={p.category}
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
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e5e2dd', borderRadius: 12, marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9f7f4', borderBottom: '1px solid #e5e2dd' }}>
                {(can('products.edit') || can('products.delete')) && (
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a1a1a' }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => handleSelectAllVisible(e.target.checked)}
                      ref={(el) => {
                        if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a1a1a' }}>Nombre</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a1a1a' }}>SKU</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1a1a1a' }}>Categoría</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#1a1a1a' }}>Precio</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>Stock</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>Destacado</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f0ede8', background: idx % 2 === 0 ? '#fff' : '#f9f7f4' }}>
                  {(can('products.edit') || can('products.delete')) && (
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={(e) => handleSelectProduct(p.id, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  <td style={{ padding: '12px 16px', color: '#1a1a1a', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p.image && <img src={p.image} alt={p.name} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} />}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#767676', fontSize: 12 }}>{p.sku}</td>
                  <td style={{ padding: '12px 16px', color: '#767676' }}>{p.category}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#1a1a1a', fontWeight: 600 }}>
                    ${p.price?.toFixed(2) || '0.00'}
                    {p.discount && <span style={{ color: '#c75050', marginLeft: 4 }}>-{p.discount}%</span>}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: p.stock > 0 ? '#d4edda' : '#f8d7da',
                      color: p.stock > 0 ? '#155724' : '#721c24',
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: p.inStock ? '#d4edda' : '#f8d7da',
                      color: p.inStock ? '#155724' : '#721c24',
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {p.inStock ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: p.isFeatured ? '#8fa99a' : '#e5e2dd',
                      color: p.isFeatured ? '#fff' : '#767676',
                      fontSize: 11,
                      fontWeight: 500
                    }}>
                      {p.isFeatured ? '★' : '☆'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {can('products.edit') && (
                        <button
                          onClick={() => handleEdit(p.id)}
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
                        >
                          Editar
                        </button>
                      )}
                      {can('products.delete') && (
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
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
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
