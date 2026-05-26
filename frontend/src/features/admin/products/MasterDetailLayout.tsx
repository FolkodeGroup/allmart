import React, { useState, useCallback, useMemo } from 'react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { ProductListPanel } from './ProductListPanel';
import { ProductDetailPanel } from './ProductDetailPanel';
import styles from './MasterDetailLayout.module.css';
import { AdminVariantsProvider } from '../../../context';

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

export function MasterDetailLayout({
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
        canEdit={canEdit && !!onEdit}
        canDelete={canDelete && !!onDelete}
      />

      {/* Detail Panel (Right) - Only show when product is selected */}
      {selectedProduct && (
        <AdminVariantsProvider>
          <ProductDetailPanel
            product={selectedProduct}
            onEdit={onEdit}
            onDelete={onDeleteDirect || onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </AdminVariantsProvider>
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
