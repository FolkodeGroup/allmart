import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/useAdminProductsContext';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { ArrowLeft, MoveLeft, MoveRight, Check, X, Star } from 'lucide-react';
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

type TabName = 'basic' | 'pricing' | 'variants' | 'images' | 'seo';

interface ProductDetailPanelProps {
  product: AdminProduct;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onBack?: () => void;
  isMobileActive?: boolean;
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
  onBack,
  isMobileActive = true,
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

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setStatusFlags({
      inStock: product.inStock,
      isFeatured: product.isFeatured ?? false,
    });
  }, [product.inStock, product.isFeatured]);

  useEffect(() => {
    const activeBtn = tabButtonRefs.current[activeTab];
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

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

  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      onDelete(product.id);
      setShowDeleteModal(false);
      if (onBack) onBack();
    } finally {
      setIsDeleting(false);
    }
  }, [product.id, onDelete, onBack]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY * 1.2) {
      const currentIndex = TAB_ORDER.indexOf(activeTab as Exclude<TabName, 'seo'>);

      if (deltaX < 0 && currentIndex < TAB_ORDER.length - 1) {
        setActiveTab(TAB_ORDER[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        setActiveTab(TAB_ORDER[currentIndex - 1]);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

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
      default:
        return null;
    }
  };

  const currentTabIndex = TAB_ORDER.indexOf(activeTab as Exclude<TabName, 'seo'>);

  // 🟢 RENDERIZADO CONDICIONAL DE ACCIONES MÓVILES: Solo cuando la vista de detalle está realmente activa en móvil
  const renderMobileActions = () => {
    if (!canEdit && !canDelete) return null;
    if (!isMobileActive) return null;

    const actionsMarkup = (
      <div className={styles.mobileActionsOverlay}>
        <div className={styles.mobileActionsContainer}>
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product.id)}
              className={styles.btnEdit}
            >
              Editar
            </button>
          )}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className={styles.btnDelete}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    );

    if (typeof document === 'undefined') return actionsMarkup;
    return createPortal(actionsMarkup, document.body);
  };

  return (
    <div className={`${styles.panel} pdPanelMobileSingleScroll`}>
      <style>{`
        @media (max-width: 1023px) {
          .pdPanelMobileSingleScroll {
            height: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
            padding-left: 6px !important;
            padding-right: 6px !important;
            padding-bottom: 110px !important;
          }

          .stickyMobileBackBar {
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            min-height: 48px;
            padding: 8px 12px;
            background: var(--color-bg-primary, #ffffff);
            border-bottom: 1px solid var(--color-border, #e5e2dd);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            margin-bottom: 8px;
          }

          .stickyMobileBackBtn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: transparent;
            border: none;
            color: var(--color-primary, #769282);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            padding: 6px 0;
            min-height: 44px;
          }

          .pdHeaderCardMobile {
            margin-top: 2px !important;
            padding: 12px !important;
          }
        }

        @media (min-width: 1024px) {
          .stickyMobileBackBar {
            display: none !important;
          }
        }
      `}</style>

      {/* Barra de regreso pegajosa para móvil */}
      {onBack && (
        <div className="stickyMobileBackBar">
          <button
            type="button"
            className="stickyMobileBackBtn"
            onClick={onBack}
            aria-label="Volver a la lista de productos"
          >
            <ArrowLeft size={18} />
            <span>Volver a Productos</span>
          </button>
        </div>
      )}

      {/* Tarjeta de Cabecera Unificada */}
      <div className={`${styles.headerCard} pdHeaderCardMobile`}>
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
                    {statusFlags.inStock ? (
                      <><Check size={14} /> Con Stock</>
                    ) : (
                      <><X size={14} /> Sin stock</>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`${styles.statusToggle} ${statusFlags.isFeatured ? styles.statusToggleActive : styles.statusToggleInactive}`}
                    onClick={() => handleToggleStatus('isFeatured')}
                    disabled={!canEdit || isSavingStatus}
                    aria-pressed={statusFlags.isFeatured}
                  >
                    <Star size={14} fill={statusFlags.isFeatured ? 'currentColor' : 'none'} />
                    {statusFlags.isFeatured ? 'Destacado' : 'No destacado'}
                  </button>
                </div>
              </div>
            </div>

            {(canEdit || canDelete) && (
              <div className={`${styles.panelActions} ${styles.desktopActions}`}>
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

        <div className={styles.tabsContainer}>
          <div className={styles.tabsList}>
            {TAB_ORDER.map(tab => (
              <button
                key={tab}
                ref={el => { tabButtonRefs.current[tab] = el; }}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.swipeHintBar}>
        <span className={styles.swipeHintText}>
          {currentTabIndex > 0 && <MoveLeft size={12} />}
          Deslizá horizontalmente para cambiar de pestaña
          {currentTabIndex < TAB_ORDER.length - 1 && <MoveRight size={12} />}
        </span>
      </div>

      <div
        className={styles.tabContent}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {renderTabContent()}
      </div>

      {renderMobileActions()}

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