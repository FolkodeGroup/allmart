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

  // Refs para gestos táctiles (Swipe)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setStatusFlags({
      inStock: product.inStock,
      isFeatured: product.isFeatured ?? false,
    });
  }, [product.inStock, product.isFeatured]);

  // Centrar automáticamente el botón de la pestaña activa en la cabecera (defensivo para JSDOM)
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
      if (onBack) onBack();
    } finally {
      setIsDeleting(false);
    }
  }, [product.id, onDelete, onBack]);

  // Cancelar eliminación
  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // ── Gestos de deslizamiento horizontal (Swipe Tabs) ──────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // Requiere deslizamiento horizontal >= 50px y que el movimiento X sea mayor al vertical Y
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY * 1.2) {
      const currentIndex = TAB_ORDER.indexOf(activeTab as Exclude<TabName, 'seo'>);

      if (deltaX < 0 && currentIndex < TAB_ORDER.length - 1) {
        // Swipe izquierda -> Siguiente pestaña
        setActiveTab(TAB_ORDER[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        // Swipe derecha -> Pestaña anterior
        setActiveTab(TAB_ORDER[currentIndex - 1]);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

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
      default:
        return null;
    }
  };

  const currentTabIndex = TAB_ORDER.indexOf(activeTab as Exclude<TabName, 'seo'>);

  // Renderizar la barra de acciones en móviles mediante un portal a document.body
  const renderMobileActions = () => {
    if (!canEdit && !canDelete) return null;

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
    <div className={styles.panel}>
      {/* Tarjeta de Cabecera Unificada (Info + Pestañas) */}
      <div className={styles.headerCard}>
        <div className={styles.panelHeader}>
          {onBack && (
            <button type="button" className={styles.mobileBackBtn} onClick={onBack}>
              <ArrowLeft size={18} /> Volver a la lista
            </button>
          )}
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

                {/* Badges de estado mejorados con iconos */}
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
            {/* acciones en desktop */}
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

        {/* Pestañas integradas dentro de la misma tarjeta de cabecera */}
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

      {/* Indicador táctil de deslizamiento (solo visible en móviles) */}
      <div className={styles.swipeHintBar}>
        <span className={styles.swipeHintText}>
          {currentTabIndex > 0 && <MoveLeft size={12} />}
          Deslizá horizontalmente para cambiar de pestaña
          {currentTabIndex < TAB_ORDER.length - 1 && <MoveRight size={12} />}
        </span>
      </div>

      {/* Tab Content con detector de gestos de deslizamiento */}
      <div
        className={styles.tabContent}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {renderTabContent()}
      </div>

      {/* Acciones móviles portaleadas directamente a document.body */}
      {renderMobileActions()}

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