import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAdminProducts } from '../../../context/useAdminProductsContext';
import type { StatusFilter, StockLevelFilter } from './productsService';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { useScrollPreserver } from '../../../utils/tableScrollPreserver';

// Components
import { AdminProductFormPage } from './AdminProductFormPage';
import { MasterDetailLayout } from './MasterDetailLayout';
import { ProductWizard } from './productWizard/ProductWizard';
import type { WizardProduct } from './productWizard/types';

// UI Components
import { EmptyState } from '../../../components/ui/EmptyState';
import { PackageSearch, AlertCircle } from 'lucide-react';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { ProductHeader } from '../../../components/ui/ProductHeader';
import { ProductFilters } from '../../../components/ui/ProductFilters';
import { ProductPagination } from '../../../components/ui/ProductPagination';

// Styles
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminProducts.module.css';

type ViewMode = 'list' | 'form';

export function AdminProducts() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Form management
  const [editId, setEditId] = useState<string | null>(null);
  const [editPage, setEditPage] = useState<number>(1);
  const [showWizard, setShowWizard] = useState(false);
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
  const { products, deleteProduct, duplicateProduct, addProduct, loading, error, refreshProducts, page: apiPage, totalPages: apiTotalPages, total } = useAdminProducts();
  // Duplicar producto
  const handleDuplicate = useCallback(async (product: import('../../../context/AdminProductsContext').AdminProduct) => {
    try {
      // Utiliza el helper oficial para duplicar productos
      const { getDuplicateProductPayload } = await import('./productsService');
      const payload = getDuplicateProductPayload(product);
      await duplicateProduct({ ...product, ...payload });
      toast.success('Producto duplicado con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al duplicar: ${message}`);
    }
  }, [duplicateProduct]);
  const { can } = useAdminAuth();
  const { categories } = useAdminCategories();

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

  const handleDelete = useCallback((id: string) => {
    try {
      deleteProduct(id);
      toast.success('Producto eliminado con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al eliminar: ${message}`);
    }
  }, [deleteProduct]);

  // === WIZARD HANDLER ===

  const handleWizardPublish = async (wizardProduct: WizardProduct) => {
    try {
      if (!wizardProduct.name || !wizardProduct.price || !wizardProduct.sku || !wizardProduct.categoryId) {
        toast.error('Completa todos los campos requeridos: nombre, precio, categóría y SKU');
        return;
      }
      await addProduct({
        name: wizardProduct.name || 'Sin nombre',
        slug: (wizardProduct.name || 'sin-nombre').toLowerCase().replace(/\s+/g, '-'),
        description: wizardProduct.description || '',
        shortDescription: wizardProduct.shortDescription || '',
        price: wizardProduct.price || 0,
        stock: wizardProduct.stock || 0,
        inStock: true,
        images: wizardProduct.images || [],
        category: categories.find(c => c.id === wizardProduct.categoryId) || { id: wizardProduct.categoryId, name: 'Unnamed', slug: '', isVisible: true },
        categoryIds: wizardProduct.categoryId ? [wizardProduct.categoryId] : [],
        tags: wizardProduct.tags || [],
        features: [],
        rating: 0,
        reviewCount: 0,
        sku: wizardProduct.sku || '',
        variants: [],
      });
      toast.success('¡Producto creado exitosamente!');
      refreshProducts({ page: 1, limit: 10 });
      setShowWizard(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear producto';
      toast.error(`Error: ${message}`);
      throw err;
    }
  };

  return (
    <main
      ref={containerRef}
      className={`${sectionStyles.page} ${styles.productsPage} dark:bg-gray-900 dark:text-gray-100`}
      aria-label="Gestión de productos"
    >
      {viewMode === 'list' && (
        <>
          <ProductHeader canCreate={can('products.create')} onNew={handleNew} onWizard={() => setShowWizard(true)} />

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
                products={products}
                loading={loading}
                error={error}
                onEdit={can('products.edit') ? handleEdit : undefined}
                onDelete={can('products.delete') ? handleDelete : undefined}
                onDuplicate={can('products.create') ? handleDuplicate : undefined}
                canEdit={can('products.edit')}
                canDelete={can('products.delete')}
                defaultSelectedProductId={editId || undefined}
              />

              {total > 10 && (
                <ProductPagination
                  page={apiPage}
                  totalPages={apiTotalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          )}

          {showWizard && (
            <ProductWizard
              open={showWizard}
              onClose={() => setShowWizard(false)}
              categories={categories.map(c => ({ id: c.id, name: c.name || 'Unnamed' }))}
              onPublish={handleWizardPublish}
            />
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
