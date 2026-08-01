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
  onMobileViewChange?: (view: 'list' | 'detail') => void;
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
  onMobileViewChange,
}: MasterDetailLayoutProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(
    defaultSelectedProductId
  );
  
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const isEmpty = !loading && !error && products.length === 0;

  React.useEffect(() => {
    if (loading || products.length === 0) return;

    setSelectedProductId(prev => {
      const exists = products.some(p => p.id === prev);
      if (exists) return prev;
      return products[0].id;
    });
  }, [products, loading]);

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const handleSelectProduct = useCallback((id: string) => {
    setSelectedProductId(id);
    setMobileView('detail');
    onMobileViewChange?.('detail');
  }, [onMobileViewChange]);

  const handleBackToList = useCallback(() => {
    setMobileView('list');
    onMobileViewChange?.('list');
  }, [onMobileViewChange]);

  const detailContent = useMemo(() => {
    if (!selectedProduct) return null;
    return (
      <ProductDetailPanel
        product={selectedProduct}
        onEdit={onEdit}
        onDelete={onDeleteDirect || onDelete}
        canEdit={canEdit}
        canDelete={canDelete}
        onBack={handleBackToList}
      />
    );
  }, [selectedProduct, onEdit, onDeleteDirect, onDelete, canEdit, canDelete, handleBackToList]);

  return (
    <div className={`${styles.container} ${isEmpty ? styles.containerEmpty : ''} ${mobileView === 'detail' ? styles.showDetail : ''} masterDetailMobileContainer`}>
      <style>{`
        @media (max-width: 1023px) {
          .masterDetailMobileContainer,
          .masterDetailMobileContainer .detailWrapper {
            height: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
          }
        }
      `}</style>

      {/* List Panel (Left) */}
      <div className={styles.listPane}>
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
      </div>

      {/* Detail Panel (Right) */}
      <div className={`${styles.detailWrapper} masterDetailMobileSingleScroll`}>
        <AdminVariantsProvider>
          {detailContent}
          {!selectedProduct && !loading && products.length > 0 && (
            <div className={styles.emptyDetail}>
              <div className={styles.emptyDetailContent}>
                <p>Selecciona un producto para ver sus detalles</p>
              </div>
            </div>
          )}

          {loading && (
            <div className={styles.loadingDetail}>
              <div className={styles.spinner} />
            </div>
          )}
        </AdminVariantsProvider>
      </div>

      {children && <div className={styles.toolbarArea}>{children}</div>}
    </div>
  );
}

export const MasterDetailLayout = React.memo(MasterDetailLayoutInner);