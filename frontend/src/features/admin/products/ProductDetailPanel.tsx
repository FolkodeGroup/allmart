import React, { useState, Suspense } from 'react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { X } from 'lucide-react';
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
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (product: AdminProduct) => void;
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

export function ProductDetailPanel({
  product,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  canEdit = true,
  canDelete = true,
}: ProductDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabName>('basic');

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
            </div>
          </div>
        </div>
        <button onClick={onClose} className={styles.closeBtn} title="Cerrar">
          <X size={20} />
        </button>
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

      {/* Footer with actions */}
      {(canEdit || canDelete || onDuplicate) && (
        <div className={styles.panelFooter}>
          <div className={styles.actions}>
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(product.id)}
                className={styles.btnEdit}
              >
                Editar
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(product)}
                className={styles.btnEdit}
                title="Duplicar producto"
              >
                Duplicar
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(product.id)}
                className={styles.btnDelete}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabLoadingFallback() {
  return (
    <div className={styles.loadingFallback}>
      <div className={styles.spinner} />
      <p>Cargando...</p>
    </div>
  );
}
