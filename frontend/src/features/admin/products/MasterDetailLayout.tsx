import React, { useState, useCallback, useMemo } from 'react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { ProductListPanel } from './ProductListPanel';
import { ProductDetailPanel } from './ProductDetailPanel';
import styles from './MasterDetailLayout.module.css';

interface MasterDetailLayoutProps {
  products: AdminProduct[];
  loading: boolean;
  error: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (product: AdminProduct) => void;
  canEdit: boolean;
  canDelete: boolean;
  children?: React.ReactNode;
  defaultSelectedProductId?: string;
}

export function MasterDetailLayout({
  products,
  loading,
  error,
  onEdit,
  onDelete,
  onDuplicate,
  canEdit,
  canDelete,
  children,
  defaultSelectedProductId,
}: MasterDetailLayoutProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Auto-select product: prefer defaultSelectedProductId if provided and valid,
  // otherwise select the first product if none is selected
  React.useEffect(() => {
    if (loading) return;

    if (defaultSelectedProductId) {
      // Check if the preferred product exists in the list
      const preferredExists = products.some(p => p.id === defaultSelectedProductId);
      if (preferredExists) {
        setSelectedProductId(defaultSelectedProductId);
        return;
      }
    }

    // Fall back to first product if no selection or preferred not found
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, loading, selectedProductId, defaultSelectedProductId]);

  // Get selected product
  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const handleSelectProduct = useCallback((id: string) => {
    setSelectedProductId(id);
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
      />

      {/* Detail Panel (Right) - Only show when product is selected */}
      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
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
