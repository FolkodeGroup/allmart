import React, { useState, useEffect, Suspense, useCallback } from 'react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/useAdminProductsContext';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import styles from './ProductDetailPanel.module.css';

// Lazy load tab components
const ProductDetailBasic = React.lazy(() =>
  import('./tabs/ProductDetailBasic').then(m => ({ default: m.ProductDetailBasic }))
);
const ProductDetailPricing = React.lazy(() =>
  import('./tabs/ProductDetailPricing').then(m => ({ default: m.ProductDetailPricing }))
);
const ProductDetailVariants = React.lazy(() =>
  import('./tabs/ProductDetailVariants').then(m => ({ default: m.ProductDetailVariants }))
);
const ProductDetailImages = React.lazy(() =>
  import('./tabs/ProductDetailImages').then(m => ({ default: m.ProductDetailImages }))
);
// ...existing code...

type TabName = 'basic' | 'pricing' | 'variants' | 'images' | 'seo';

interface ProductDetailPanelProps {
  product: AdminProduct;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const TAB_LABELS: Record<Exclude<TabName, 'seo'>, string> = {
  basic: 'Básico',
  pricing: 'Precios e inventario',
  variants: 'Variantes',
  images: 'Imágenes',
};

const TAB_ORDER: Exclude<TabName, 'seo'>[] = ['basic', 'pricing', 'variants', 'images'];

export const ProductDetailPanel = React.memo(function ProductDetailPanelComponent({
  product,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: ProductDetailPanelProps) {
  const { updateProduct } = useAdminProducts();
  const [activeTab, setActiveTab] = useState<TabName>('basic');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFlags, setStatusFlags] = useState({
    inStock: product.inStock,
    isFeatured: product.isFeatured ?? false,
  });
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  useEffect(() => {
    setStatusFlags({
      inStock: product.inStock,
      isFeatured: product.isFeatured ?? false,
    });
  }, [product.inStock, product.isFeatured]);

  const handleToggleStatus = useCallback(async (field: 'inStock' | 'isFeatured') => {
    if (!canEdit) return;

    const nextValue = !statusFlags[field];
    setStatusFlags((prev) => ({ ...prev, [field]: nextValue }));
    setIsSavingStatus(true);

    try {
      await updateProduct(product.id, { [field]: nextValue });
    } catch {
      setStatusFlags((prev) => ({ ...prev, [field]: !nextValue }));
    } finally {
      setIsSavingStatus(false);
    }
  }, [canEdit, product.id, statusFlags, updateProduct]);

  // Solicitar confirmación de eliminación
  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Confirmar y ejecutar eliminación
  const handleConfirmDelete = useCallback(async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      onDelete(product.id);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  }, [product.id, onDelete]);

  // Cancelar eliminación
  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // Render tab content with suspense fallback
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <ProductDetailBasic product={product} />
          </Suspense>
        );
      case 'pricing':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <ProductDetailPricing product={product} />
          </Suspense>
        );
      case 'variants':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <ProductDetailVariants productId={product.id} />
          </Suspense>
        );
      case 'images':
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <ProductDetailImages productId={product.id} />
          </Suspense>
        );
      // case 'seo':
      //   return (
      //     <Suspense fallback={<TabLoadingFallback />}>
      //       <ProductDetailSEO product={product} />
      //     </Suspense>
      //   );
      default:
        return null;
    }
  };

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.headerContent}>
          <div className={styles.productTitle}>
            {product.images?.[0] && (
              <img
                src={product.images[0]}
                alt={product.name}
                className={styles.productImage}
              />
            )}
            <div className={styles.titleSection}>
              <h2 className={styles.panelTitle}>{product.name}</h2>
              <p className={styles.productSKU}>{product.sku}</p>
              <div className={styles.headerStatus}>
                <button
                  type="button"
                  className={`${styles.statusToggle} ${statusFlags.inStock ? styles.statusToggleActive : styles.statusToggleInactive}`}
                  onClick={() => handleToggleStatus('inStock')}
                  disabled={!canEdit || isSavingStatus}
                  aria-pressed={statusFlags.inStock}
                >
                  {statusFlags.inStock ? 'Con Stock' : 'Sin stock'}
                </button>
                <button
                  type="button"
                  className={`${styles.statusToggle} ${statusFlags.isFeatured ? styles.statusToggleActive : styles.statusToggleInactive}`}
                  onClick={() => handleToggleStatus('isFeatured')}
                  disabled={!canEdit || isSavingStatus}
                  aria-pressed={statusFlags.isFeatured}
                >
                  {statusFlags.isFeatured ? 'Destacado' : 'No destacado'}
                </button>
              </div>
            </div>
          </div>
          {/* actions */}
          {(canEdit || canDelete) && (
            <div className={styles.panelActions}>
              <div className={styles.actions}>
                {canEdit && onEdit && (
                  <button
                    onClick={() => onEdit(product.id)}
                    className={styles.btnEdit}
                  >
                    Editar
                  </button>
                )}
                {canDelete && onDelete && (
                  <button
                    onClick={handleDeleteClick}
                    className={styles.btnDelete}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          {TAB_ORDER.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>



      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <ModalConfirm
          open={showDeleteModal}
          title="Eliminar Producto"
          message={`¿Estás seguro de que deseas eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`}
          confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
          cancelText="Cancelar"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
});

function TabLoadingFallback() {
  return (
    <div className={styles.loadingFallback}>
      <div className={styles.spinner} />
      <p>Cargando...</p>
    </div>
  );
}
