import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useAdminProducts } from '../../../context/useAdminProductsContext';
import type { StatusFilter, StockLevelFilter } from './productsService';
import { exportCatalogPdf } from './productsService';
import { exportProductsToCSV, exportProductsToExcel } from '../../../utils/exportProducts';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { useScrollPreserver } from '../../../utils/tableScrollPreserver';

// Components
import { AdminProductFormPage } from './AdminProductFormPage';
import { MasterDetailLayout } from './MasterDetailLayout';

// UI Components
import { EmptyState } from '../../../components/ui/EmptyState';
import { PackageSearch, AlertCircle } from 'lucide-react';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { ProductHeader } from '../../../components/ui/ProductHeader';
import { ExportButtons } from '../../../components/ui/ExportButtons';
import { ProductFilters } from '../../../components/ui/ProductFilters';

// Styles
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminProducts.module.css';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';

type ViewMode = 'list' | 'form';
type ProductSortField = 'name' | 'sku' | 'category';
type ProductSortDirection = 'asc' | 'desc';

export function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Form management
  const [editId, setEditId] = useState<string | null>(null);
  const [editPage, setEditPage] = useState<number>(1);

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const resetUnsavedChangesFn = () => { };

  // Filters and search
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<StockLevelFilter>('all');

  // Sort state
  const [sortField, setSortField] = useState<ProductSortField>('name');
  const [sortDirection, setSortDirection] = useState<ProductSortDirection>('asc');

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<import('../../../context/AdminProductsContext').AdminProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Context and hooks
  const { products, deleteProduct, loading, error, refreshProducts, page: apiPage, totalPages: apiTotalPages, total } = useAdminProducts();

  const { can, token } = useAdminAuth();
  const { categories } = useAdminCategories();

  // PDF export
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportLoadingFormat, setExportLoadingFormat] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);

  // ─── Auto-open edit form if 'edit' param is present ───────────────────────
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam && !editId) {
      setEditId(editParam);
      setViewMode('form');
      // Clear the edit parameter from URL
      setSearchParams(prev => {
        prev.delete('edit');
        return prev;
      });
    }
  }, [searchParams, editId, setSearchParams]);

  const handleExportPdf = useCallback(async () => {
    if (!token) {
      toast.error('Sesión no iniciada. Por favor, volvé a iniciar sesión.');
      return;
    }
    setIsExportingPdf(true);
    try {
      const { blob, filename } = await exportCatalogPdf(
        {
          title: 'Catálogo Allmart',
          columns: 3,
          paperFormat: 'A4',
          filters: {
            status: statusFilter,
            q: search || undefined,
            categoryId: categoryFilter || undefined,
            stockLevel: stockLevelFilter,
          },
        },
        token,
      );
      // Descargar en el navegador
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Catálogo PDF descargado con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al exportar PDF: ${message}`);
    } finally {
      setIsExportingPdf(false);
    }
  }, [token, search, categoryFilter, statusFilter, stockLevelFilter]);

  const handleExportCSV = useCallback(() => {
    if (!products.length) {
      toast.error('No hay productos para exportar.');
      return;
    }
    setExportLoadingFormat('csv');
    try {
      exportProductsToCSV(products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category?.name ?? 'Sin categoría',
        price: p.price,
        stock: p.stock,
        inStock: p.inStock,
        isFeatured: p.isFeatured,
      })));
      toast.success('CSV de productos descargado.');
    } catch {
      toast.error('Error al exportar CSV.');
    } finally {
      setExportLoadingFormat(null);
    }
  }, [products]);

  const handleExportExcel = useCallback(async () => {
    if (!products.length) {
      toast.error('No hay productos para exportar.');
      return;
    }
    setExportLoadingFormat('xlsx');
    try {
      exportProductsToExcel(products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category?.name ?? 'Sin categoría',
        price: p.price,
        stock: p.stock,
        inStock: p.inStock,
        isFeatured: p.isFeatured,
      })));
      toast.success('Excel de productos descargado.');
    } catch {
      toast.error('Error al exportar Excel.');
    } finally {
      setExportLoadingFormat(null);
    }
  }, [products]);

  // Scroll preservation
  const containerRef = useRef<HTMLElement>(null);
  useScrollPreserver(containerRef as React.RefObject<HTMLElement>, 'products-master-detail', [apiPage, search, categoryFilter, statusFilter, stockLevelFilter, sortField, sortDirection]);

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
      setEditId(null);
    },
  });

  // Search & filter
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

  // Sort products based on sort field and direction
  const sortedProducts = useMemo(() => {
    const ordered = [...products];

    ordered.sort((a, b) => {
      let result = 0;

      switch (sortField) {
        case 'name':
          result = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
          break;
        case 'sku':
          result = a.sku.localeCompare(b.sku, 'es', { sensitivity: 'base' });
          break;
        case 'category':
          result = (a.category?.name ?? '').localeCompare(b.category?.name ?? '', 'es', { sensitivity: 'base' });
          break;
      }

      return sortDirection === 'asc' ? result : -result;
    });

    return ordered;
  }, [products, sortField, sortDirection]);

  // === FORM/EDIT HANDLERS ===

  const handleNew = useCallback(() => {
    if (unsavedChanges) {
      interceptNavigation(() => {
        setEditId(null);
        setViewMode('form');
      });
    } else {
      setEditId(null);
      setViewMode('form');
    }
  }, [unsavedChanges, interceptNavigation]);

  const handleEdit = useCallback((id: string) => {
    if (unsavedChanges) {
      interceptNavigation(() => { setEditId(id); setEditPage(apiPage); setViewMode('form'); });
    } else {
      setEditId(id);
      setEditPage(apiPage);
      setViewMode('form');
    }
  }, [unsavedChanges, interceptNavigation, apiPage]);

  // Solicitar confirmación de eliminación (usado en el listado)
  const handleDelete = useCallback((id: string) => {
    const productToDelete = products.find(p => p.id === id);
    if (productToDelete) {
      setProductToDelete(productToDelete);
      setShowDeleteModal(true);
    }
  }, [products]);

  // Ejecutar eliminación directamente sin modal (usado en el panel de detalle)
  const handleDirectDelete = useCallback((id: string) => {
    try {
      deleteProduct(id);
      toast.success('Producto eliminado con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${message}`);
    }
  }, [deleteProduct]);

  // Confirmar y ejecutar eliminación
  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      deleteProduct(productToDelete.id);
      toast.success('Producto eliminado con éxito');
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${message}`);
    } finally {
      setIsDeleting(false);
    }
  }, [productToDelete, deleteProduct]);

  // Cancelar eliminación
  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  }, []);

  return (
    <main
      ref={containerRef}
      className={`${sectionStyles.page} ${styles.productsPage} dark:bg-gray-900 dark:text-gray-100`}
      aria-label="Gestión de productos"
    >
      {viewMode === 'list' && (
        <>
          <ProductHeader
            canCreate={can('products.create')}
            onNew={handleNew}
          />

          <ProductFilters
            search={search}
            setSearch={setSearch}
            inputRef={inputRef as React.RefObject<HTMLInputElement>}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            categories={categories}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            stockLevelFilter={stockLevelFilter}
            setStockLevelFilter={setStockLevelFilter}
            total={total}
          />

          {!loading && !error && products.length > 0 && (
            <div className={styles.actionsBar}>
              <div className={styles.exportBtnContainer}>
                <ExportButtons
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onExportPDF={handleExportPdf}
                  loading={exportLoadingFormat ?? (isExportingPdf ? 'pdf' : null)}
                />
              </div>

              <div className={styles.sortContainer}>
                <div className={styles.sortControls}>
                  <span className={styles.sortLabel}>Ordenar:</span>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as ProductSortField)}
                    className={styles.sortSelect}
                  >
                    <option value="name">Nombre</option>
                    <option value="sku">SKU</option>
                    <option value="category">Categoría</option>
                  </select>
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

          {!loading && error && (
            <EmptyState
              icon={<AlertCircle size={48} color="#ef4444" />}
              title="Error al cargar productos"
              description={error}
              action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
            />
          )}

          {!loading && !error && products.length === 0 && (
            <EmptyState
              icon={<PackageSearch size={48} color="#94a3b8" />}
              title="No se encontraron productos"
              description={
                search || categoryFilter
                  ? 'Probá ajustando los filtros o la búsqueda para encontrar lo que necesitás.'
                  : 'Todavía no cargaste ningún producto al catálogo. ¡Empezá ahora!'
              }
              action={
                can('products.create')
                  ? { label: 'Nuevo Producto', onClick: handleNew }
                  : undefined
              }
            />
          )}

          {!loading && !error && products.length > 0 && (
            <div className={styles.contentArea}>
              <MasterDetailLayout
                products={sortedProducts}
                loading={loading}
                error={error}
                onEdit={can('products.edit') ? handleEdit : undefined}
                onDelete={can('products.delete') ? handleDelete : undefined}
                onDeleteDirect={can('products.delete') ? handleDirectDelete : undefined}
                canEdit={can('products.edit')}
                canDelete={can('products.delete')}
                defaultSelectedProductId={editId || undefined}
              />

              {total > 10 && (
                <AdminPagination
                  page={apiPage}
                  totalPages={apiTotalPages}
                  onPageChange={handlePageChange}
                  ariaLabel="Paginación de productos"
                />
              )}
            </div>
          )}

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

          {showDeleteModal && productToDelete && (
            <ModalConfirm
              open={showDeleteModal}
              title="Eliminar Producto"
              message={`¿Estás seguro de que deseas eliminar el producto "${productToDelete.name}"? Esta acción no se puede deshacer.`}
              confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
              cancelText="Cancelar"
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
            />
          )}
        </>
      )}

      {viewMode === 'form' && (
        <AdminProductFormPage
          productId={editId}
          onBack={() => {
            setViewMode('list');
            setEditId(null);
          }}
          onSuccess={() => {
            // Keep editId to maintain product selection after save
            setViewMode('list');
            refreshProducts({
              q: search,
              categoryId: categoryFilter,
              status: statusFilter,
              stockLevel: stockLevelFilter,
              page: editPage,
              limit: 10,
            });
          }}
          onUnsavedChanges={setUnsavedChanges}
        />
      )}
    </main>
  );
}
