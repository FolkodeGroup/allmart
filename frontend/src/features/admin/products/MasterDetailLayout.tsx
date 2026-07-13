import React, { useState, useCallback, useMemo } from 'react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { ProductListPanel } from './ProductListPanel';
import { ProductDetailPanel } from './ProductDetailPanel';
import styles from './MasterDetailLayout.module.css';
import { AdminVariantsProvider } from '../../../context/AdminVariantsProvider';

interface MasterDetailLayoutProps {
  products: AdminProduct[];
  loading: boolean;
  error: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDeleteDirect?: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  children?: React.ReactNode;
  defaultSelectedProductId?: string;
}

function MasterDetailLayoutInner({
  products,
  loading,
  error,
  onEdit,
  onDelete,
  onDeleteDirect,
  canEdit,
  canDelete,
  children,
  defaultSelectedProductId,
}: MasterDetailLayoutProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(
    defaultSelectedProductId
  );
  const isEmpty = !loading && !error && products.length === 0;

  // Auto-select product: prefer defaultSelectedProductId if provided and valid,
  // otherwise select the first product if none is selected
  React.useEffect(() => {
    if (loading || products.length === 0) return;

    setSelectedProductId(prev => {
      const exists = products.some(p => p.id === prev);

      // Si sigue existiendo, NO tocar
      if (exists) return prev;

      // Si no existe (ej: se eliminó), seleccionar primero
      return products[0].id;
    });
  }, [products, loading]);

  // Get selected product
  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const handleSelectProduct = useCallback((id: string) => {
    setSelectedProductId(id);
  }, []);

  // Memoize the detail content to avoid re-rendering when props don't change
  const detailContent = useMemo(() => {
    if (!selectedProduct) return null;
    return (
      <ProductDetailPanel
        product={selectedProduct}
        onEdit={onEdit}
        onDelete={onDeleteDirect || onDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }, [selectedProduct, onEdit, onDeleteDirect, onDelete, canEdit, canDelete]);

  return (
    <div className={`${styles.container} ${isEmpty ? styles.containerEmpty : ''}`}>
      {/* List Panel (Left) */}
      <ProductListPanel
        products={products}
        loading={loading}
        error={error}
        selectedProductId={selectedProductId}
        onSelectProduct={handleSelectProduct}
        onEdit={onEdit}
        onDelete={onDelete}
        canEdit={canEdit && !!onEdit}
        canDelete={canDelete && !!onDelete}
      />

      {/* Detail Panel (Right) - Keep provider mounted, conditionally render content */}
      <AdminVariantsProvider>
        {detailContent}
        {/* Empty state when no product selected */}
        {!selectedProduct && !loading && products.length > 0 && (
          <div className={styles.emptyDetail}>
            <div className={styles.emptyDetailContent}>
              <p>Selecciona un producto para ver sus detalles</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className={styles.loadingDetail}>
            <div className={styles.spinner} />
          </div>
        )}
      </AdminVariantsProvider>

      {/* Children toolbar (if provided) */}
      {children && <div className={styles.toolbarArea}>{children}</div>}
    </div>
  );
}

export const MasterDetailLayout = React.memo(MasterDetailLayoutInner);
