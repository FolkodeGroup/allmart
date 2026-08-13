// frontend/src/features/admin/products/AdminProducts.tsx

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAdminProducts } from '../../../context/useAdminProductsContext';
import type { StatusFilter, StockLevelFilter } from './productsService';
import { exportProductsToCSV, exportProductsToExcel, exportProductsPDF } from '../../../utils/exportProducts';
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
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';

// Styles
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminProducts.module.css';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';

type ViewMode = 'list' | 'form';
type ProductSortField = 'name' | 'sku' | 'category';
type ProductSortDirection = 'asc' | 'desc';

// Ajustado a 9 productos por página para llenar el panel izquierdo de forma simétrica
const PAGE_LIMIT = 9;

export function AdminProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Estado para controlar si el detalle está abierto en móvil
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

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

  const { can } = useAdminAuth();
  const { categories } = useAdminCategories();

  // PDF export
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportLoadingFormat, setExportLoadingFormat] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);

  // Initial Load State
  const isFirstRender = useRef(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam && !editId) {
      setEditId(editParam);
      setViewMode('form');
      setSearchParams(prev => {
        prev.delete('edit');
        return prev;
      });
    }
  }, [searchParams, editId, setSearchParams]);

  const handleExportPdf = useCallback(async () => {
    setIsExportingPdf(true);
    setExportLoadingFormat('pdf');
    try {
      const exportable = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name ?? 'Sin categoría',
        price: p.price,
        description: p.shortDescription || p.description || '',
        imageUrl: p.images?.[0] || undefined,
        stock: p.stock,
        inStock: p.inStock,
        isFeatured: p.isFeatured,
      }));
      await exportProductsPDF(exportable);
      toast.success('Catálogo PDF descargado con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al exportar PDF: ${message}`);
    } finally {
      setIsExportingPdf(false);
      setExportLoadingFormat(null);
    }
  }, [products]);

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
      setIsMobileDetailOpen(false);
      setViewMode('list');
      navigate('/admin/productos', { replace: true });
    },
  });

  // Search & filter
  useEffect(() => {
    const executeFetch = async () => {
      if (search && search.trim().length > 0) {
        await refreshProducts({
          categoryId: categoryFilter,
          status: statusFilter,
          stockLevel: stockLevelFilter,
          page: 1,
          limit: 500,
        });
      } else {
        await refreshProducts({
          q: search,
          categoryId: categoryFilter,
          status: statusFilter,
          stockLevel: stockLevelFilter,
          page: 1,
          limit: PAGE_LIMIT,
        });
      }
    };

    if (isFirstRender.current) {
      isFirstRender.current = false;
      executeFetch().finally(() => setIsInitialLoad(false));
      return;
    }

    const timer = setTimeout(executeFetch, 400);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter, stockLevelFilter, refreshProducts]);

  const handlePageChange = useCallback((newPage: number) => {
    if (search && search.trim().length > 0) {
      refreshProducts({
        categoryId: categoryFilter,
        status: statusFilter,
        stockLevel: stockLevelFilter,
        page: 1,
        limit: 500,
      });
    } else {
      refreshProducts({
        q: search,
        categoryId: categoryFilter,
        status: statusFilter,
        stockLevel: stockLevelFilter,
        page: newPage,
        limit: PAGE_LIMIT,
      });
    }
  }, [search, categoryFilter, statusFilter, stockLevelFilter, refreshProducts]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const sortOptions = useMemo(() => [
    { value: 'name', label: 'Nombre' },
    { value: 'sku', label: 'SKU' },
    { value: 'category', label: 'Categoría' },
  ], []);

  const sortedProducts = useMemo(() => {
    const ordered = [...filteredProducts];

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
  }, [filteredProducts, sortField, sortDirection]);

  const handleNew = useCallback(() => {
    if (unsavedChanges) {
      interceptNavigation(() => {
        setEditId(null);
        setViewMode('form');
        setIsMobileDetailOpen(false);
      });
    } else {
      setEditId(null);
      setViewMode('form');
      setIsMobileDetailOpen(false);
    }
  }, [unsavedChanges, interceptNavigation]);

  const handleEdit = useCallback((id: string) => {
    if (unsavedChanges) {
      interceptNavigation(() => {
        setEditId(id);
        setEditPage(apiPage);
        setViewMode('form');
        setIsMobileDetailOpen(false);
      });
    } else {
      setEditId(id);
      setEditPage(apiPage);
      setViewMode('form');
      setIsMobileDetailOpen(false);
    }
  }, [unsavedChanges, interceptNavigation, apiPage]);

  const handleDelete = useCallback((id: string) => {
    const productToDelete = products.find(p => p.id === id);
    if (productToDelete) {
      setProductToDelete(productToDelete);
      setShowDeleteModal(true);
    }
  }, [products]);

  const handleDirectDelete = useCallback((id: string) => {
    try {
      deleteProduct(id);
      toast.success('Producto eliminado con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${message}`);
    }
  }, [deleteProduct]);

  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
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

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  }, []);

  return (
    <main
      ref={containerRef}
      className={`${sectionStyles.page} ${styles.productsPage} ${isMobileDetailOpen ? styles.mobileDetailActive : ''} dark:bg-gray-900 dark:text-gray-100`}
      aria-label="Gestión de productos"
    >
      <style>{`
        /* AISLAMIENTO ESTRICTO DE ESCRITORIO */
        @media (min-width: 768px) {
          .actionsBarDesktop {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            margin-bottom: 0px !important;
          }
          .exportBtnContainerDesktop {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }
          .sortContainerDesktop {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }
        }
        @media (max-width: 767px) {
          .${styles.productsPage},
          .${sectionStyles.page} {
            padding-left: 0 !important;
            padding-right: 0 !important;
            padding-top: 6px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .actionsBarDesktop {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            gap: 12px !important;
            margin-bottom: 0 !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
            box-sizing: border-box !important;
          }
          .exportBtnContainerDesktop {
            width: 100% !important;
          }
          .sortContainerDesktop {
            width: 100% !important;
          }
        }
      `}</style>

      {viewMode === 'list' && (
        <>
          {/* Contenedor de herramientas de lista */}
          <div className={styles.listToolbarArea}>
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
          </div>

          {isInitialLoad ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
              <LoadingSpinner message="Cargando productos..." size="lg" />
            </div>
          ) : (
            <>
              {!error && (products.length > 0 || loading) && (
                <div className={`${styles.actionsBar} ${styles.listToolbarArea} actionsBarDesktop`} style={{ opacity: loading && products.length > 0 ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                  <div className={`${styles.exportBtnContainer} exportBtnContainerDesktop`}>
                    <ExportButtons
                      onExportCSV={handleExportCSV}
                      onExportExcel={handleExportExcel}
                      onExportPDF={handleExportPdf}
                      loading={exportLoadingFormat ?? (isExportingPdf ? 'pdf' : null)}
                    />
                  </div>

                  <div className={`${styles.sortContainer} sortContainerDesktop`}>
                    <div className={styles.sortControls}>
                      <span className={styles.sortLabel}>Ordenar:</span>
                      <div className={styles.sortDropdownWrapper}>
                        <Dropdown
                          options={sortOptions}
                          value={sortField}
                          onChange={(val) => setSortField(val as ProductSortField)}
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

              {!error && (products.length > 0 || loading) && (
                <div className={styles.contentArea} style={{ opacity: loading && products.length > 0 ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                  <MasterDetailLayout
                    products={sortedProducts}
                    loading={loading && products.length === 0}
                    error={error}
                    onEdit={can('products.edit') ? handleEdit : undefined}
                    onDelete={can('products.delete') ? handleDelete : undefined}
                    onDeleteDirect={can('products.delete') ? handleDirectDelete : undefined}
                    canEdit={can('products.edit')}
                    canDelete={can('products.delete')}
                    defaultSelectedProductId={editId || undefined}
                    onMobileViewChange={(view) => setIsMobileDetailOpen(view === 'detail')}
                  />

                  {total > PAGE_LIMIT && (
                    <div className={styles.listToolbarArea} style={{ marginTop: '16px' }}>
                      <AdminPagination
                        page={apiPage}
                        totalPages={apiTotalPages}
                        onPageChange={handlePageChange}
                        ariaLabel="Paginación de productos"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
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
            setIsMobileDetailOpen(false);
            navigate('/admin/productos', { replace: true });
          }}
          onSuccess={() => {
            setViewMode('list');
            setEditId(null);
            setIsMobileDetailOpen(false);
            setUnsavedChanges(false);
            navigate('/admin/productos', { replace: true });
            refreshProducts({
              q: search,
              categoryId: categoryFilter,
              status: statusFilter,
              stockLevel: stockLevelFilter,
              page: editPage,
              limit: PAGE_LIMIT,
            });
          }}
          onUnsavedChanges={setUnsavedChanges}
        />
      )}
    </main>
  );
}