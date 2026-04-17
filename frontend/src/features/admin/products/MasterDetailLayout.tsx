import React, { useState, useCallback, useMemo } from 'react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { ProductListPanel } from './ProductListPanel';
import { ProductDetailPanel } from './ProductDetailPanel';
import styles from './MasterDetailLayout.module.css';

interface MasterDetailLayoutProps {
  products: AdminProduct[];
  loading: boolean;
  error: string | null;
  selectedIds?: string[];
  onSelectChange?: (id: string, checked: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (product: AdminProduct) => void;
  canEdit: boolean;
  canDelete: boolean;
  showCheckbox?: boolean;
  children?: React.ReactNode;
}

export function MasterDetailLayout({
  products,
  loading,
  error,
  selectedIds = [],
  onSelectChange,
  onEdit,
  onDelete,
  onDuplicate,
  canEdit,
  canDelete,
  showCheckbox = false,
  children,
}: MasterDetailLayoutProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Auto-select first product if none selected
  React.useEffect(() => {
    if (!selectedProductId && products.length > 0 && !loading) {
      setSelectedProductId(products[0].id);
    }
  }, [products, loading, selectedProductId]);

  // Get selected product
  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const handleSelectProduct = useCallback((id: string) => {
    setSelectedProductId(id);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedProductId(undefined);
  }, []);

  return (
    <div className={styles.container}>
      {/* List Panel (Left) */}
      <ProductListPanel
        products={products}
        loading={loading}
        error={error}
        selectedProductId={selectedProductId}
        onSelectProduct={handleSelectProduct}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        canEdit={canEdit && !!onEdit}
        canDelete={canDelete && !!onDelete}
        showCheckbox={showCheckbox}
        selectedIds={selectedIds}
        onSelectChange={onSelectChange}
      />

      {/* Detail Panel (Right) - Only show when product is selected */}
      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          onClose={handleCloseDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

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

      {/* Children toolbar (if provided) */}
      {children && <div className={styles.toolbarArea}>{children}</div>}
    </div>
  );
}
