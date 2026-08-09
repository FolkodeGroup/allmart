import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/useAdminProductsContext';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import {
  ArrowLeft, MoveLeft, MoveRight, Check, X, Star,
  ChevronDown, ChevronUp, FileText, DollarSign, Image as ImageIcon, Layers
} from 'lucide-react';
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

  // Estado de acordeones móviles
  const [accordionsOpen, setAccordionsOpen] = useState<Record<string, boolean>>({
    basic: false,
    pricing: false,
    images: false,
    variants: false,
  });

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

  const toggleAccordion = useCallback((id: string) => {
    setAccordionsOpen(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleAllAccordions = useCallback((open: boolean) => {
    setAccordionsOpen({
      basic: open,
      pricing: open,
      images: open,
      variants: open,
    });
  }, []);

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
    <div className={`${styles.panel} pdPanelMobileSingleScroll pdPanelDesktopFixed`}>
      <style>{`
        @media (max-width: 1023px) {
          .pdPanelMobileSingleScroll {
            height: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
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
            background: var(--color-bg-primary, #111827);
            border-bottom: 1px solid var(--color-border, #374151);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            margin-bottom: 12px;
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
            background: var(--color-bg-secondary, #1f2937) !important;
            border: 1px solid var(--color-border, #374151) !important;
            border-radius: 12px !important;
            margin-bottom: 12px !important;
          }

          /* Ocultar elementos de pestañas en móvil */
          .desktopTabContainer,
          .desktopTabContent,
          .swipeHintBarMobileHide {
            display: none !important;
          }

          /* Mostrar acordeones y controles en móvil */
          .accordionToggleBarMobile {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
            gap: 8px !important;
            padding: 0 4px 10px 4px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .accordionToggleBtn {
            background: transparent !important;
            border: none !important;
            color: var(--color-primary, #769282) !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            padding: 4px 6px !important;
          }

          .accordionToggleSep {
            color: var(--color-border, #6b7280) !important;
            font-size: 12px !important;
          }

          .mobileAccordionsList {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .detailAccordionCard {
            border: 1px solid var(--color-border, #374151) !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            background: var(--color-bg-secondary, #1f2937) !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .accordionHeaderButton {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 14px 16px !important;
            background: var(--color-bg-secondary, #1f2937) !important;
            border: none !important;
            color: var(--color-text-primary, #ffffff) !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            min-height: 52px !important;
            text-align: left !important;
          }

          .accordionHeaderLeft {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
          }

          .accordionBodyMobile {
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 16px !important;
            border-top: 1px solid var(--color-border, #374151) !important;
            background: var(--color-bg-secondary, #1f2937) !important;
          }

          .accordionBodyHidden {
            display: none !important;
          }
        }

        /* 💻 ESCRITORIO (>=1024px): Pestañas tradicionales */
        @media (min-width: 1024px) {
          .stickyMobileBackBar,
          .accordionToggleBarMobile,
          .mobileAccordionsList {
            display: none !important;
          }

          .pdPanelDesktopFixed {
            display: flex !important;
            flex-direction: column !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            overflow: visible !important;
            box-sizing: border-box !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          .pdHeaderCardDesktopFixed {
            flex-shrink: 0 !important;
            position: relative !important;
            z-index: 10 !important;
            padding: 0 0 16px 0 !important;
            border-bottom: 1px solid var(--color-border, rgba(229, 226, 221, 0.15)) !important;
            background: transparent !important;
          }

          .pdTabContentDesktopScroll {
            flex: 1 1 auto !important;
            overflow: visible !important;
            overflow-y: visible !important;
            max-height: none !important;
            padding: 20px 0 36px 0 !important;
            box-sizing: border-box !important;
          }

          .desktopTabContainer {
            display: block !important;
          }

          .desktopTabContent {
            display: block !important;
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
      <div className={`${styles.headerCard} pdHeaderCardMobile pdHeaderCardDesktopFixed`}>
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
            )}
          </div>
        </div>

        {/* Pestañas para Escritorio */}
        <div className={`${styles.tabsContainer} desktopTabContainer`}>
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

      <div className={`${styles.swipeHintBar} swipeHintBarMobileHide`}>
        <span className={styles.swipeHintText}>
          {currentTabIndex > 0 && <MoveLeft size={12} />}
          Deslizá horizontalmente para cambiar de pestaña
          {currentTabIndex < TAB_ORDER.length - 1 && <MoveRight size={12} />}
        </span>
      </div>

      {/* Contenido en Escritorio */}
      <div
        className={`${styles.tabContent} pdTabContentDesktopScroll desktopTabContent`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {renderTabContent()}
      </div>

      {/* ── VISTA MÓVIL: ACORDEONES VERTICALES FULL-WIDTH ── */}
      <div className="accordionToggleBarMobile">
        <button
          type="button"
          className="accordionToggleBtn"
          onClick={() => toggleAllAccordions(true)}
        >
          Expandir todo
        </button>
        <span className="accordionToggleSep">•</span>
        <button
          type="button"
          className="accordionToggleBtn"
          onClick={() => toggleAllAccordions(false)}
        >
          Colapsar todo
        </button>
      </div>

      <div className="mobileAccordionsList">
        {/* 1. Información Básica */}
        <section className="detailAccordionCard">
          <button
            type="button"
            className="accordionHeaderButton"
            onClick={() => toggleAccordion('basic')}
            aria-expanded={accordionsOpen.basic}
          >
            <div className="accordionHeaderLeft">
              <FileText size={18} />
              <span>Información Básica</span>
            </div>
            {accordionsOpen.basic ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className={`accordionBodyMobile ${!accordionsOpen.basic ? 'accordionBodyHidden' : ''}`}>
            <Suspense fallback={<TabLoadingFallback />}>
              <ProductDetailBasic product={product} />
            </Suspense>
          </div>
        </section>

        {/* 2. Precio y Stock */}
        <section className="detailAccordionCard">
          <button
            type="button"
            className="accordionHeaderButton"
            onClick={() => toggleAccordion('pricing')}
            aria-expanded={accordionsOpen.pricing}
          >
            <div className="accordionHeaderLeft">
              <DollarSign size={18} />
              <span>Precio y Stock</span>
            </div>
            {accordionsOpen.pricing ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className={`accordionBodyMobile ${!accordionsOpen.pricing ? 'accordionBodyHidden' : ''}`}>
            <Suspense fallback={<TabLoadingFallback />}>
              <ProductDetailPricing product={product} />
            </Suspense>
          </div>
        </section>

        {/* 3. Galería de Imágenes */}
        <section className="detailAccordionCard">
          <button
            type="button"
            className="accordionHeaderButton"
            onClick={() => toggleAccordion('images')}
            aria-expanded={accordionsOpen.images}
          >
            <div className="accordionHeaderLeft">
              <ImageIcon size={18} />
              <span>Galería de Imágenes</span>
            </div>
            {accordionsOpen.images ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className={`accordionBodyMobile ${!accordionsOpen.images ? 'accordionBodyHidden' : ''}`}>
            <Suspense fallback={<TabLoadingFallback />}>
              <ProductDetailImages productId={product.id} />
            </Suspense>
          </div>
        </section>

        {/* 4. Variantes y Combinaciones */}
        <section className="detailAccordionCard">
          <button
            type="button"
            className="accordionHeaderButton"
            onClick={() => toggleAccordion('variants')}
            aria-expanded={accordionsOpen.variants}
          >
            <div className="accordionHeaderLeft">
              <Layers size={18} />
              <span>Variantes y Combinaciones</span>
            </div>
            {accordionsOpen.variants ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className={`accordionBodyMobile ${!accordionsOpen.variants ? 'accordionBodyHidden' : ''}`}>
            <Suspense fallback={<TabLoadingFallback />}>
              <ProductDetailVariants productId={product.id} />
            </Suspense>
          </div>
        </section>
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