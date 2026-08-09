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
      <div className="mobileActionsOverlay">
        <div className="mobileActionsContainer">
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
            padding: 0 0 100px 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Ocultar elementos de escritorio en móvil */
          .desktopOnlyHeader,
          .desktopTabContainer,
          .desktopTabContent,
          .swipeHintBarMobileHide {
            display: none !important;
          }

          /* Header Ultra-Compacto sin caja parásita ni espacio sobrante */
          .mobileOnlyHeader {
            position: sticky !important;
            top: 0 !important;
            z-index: 30 !important;
            background: rgba(17, 24, 39, 0.95) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border-bottom: 1px solid var(--color-border, #374151) !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            padding: 8px 8px !important;
            margin: 0 0 8px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            height: 64px !important;
          }

          .mobileBackBtn {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
            min-height: 34px !important;
            padding: 0 !important;
            background: rgba(255, 255, 255, 0.08) !important;
            border: 1px solid var(--color-border, #374151) !important;
            border-radius: 8px !important;
            color: var(--color-text-primary, #ffffff) !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }

          .mobileProductBannerImg {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            border-radius: 8px !important;
            object-fit: cover !important;
            flex-shrink: 0 !important;
            background: var(--color-bg-secondary, #1f2937) !important;
            border: 1px solid var(--color-border, #374151) !important;
          }

          .mobileProductBannerInfo {
            display: flex !important;
            flex-direction: column !important;
            min-width: 0 !important;
            flex: 1 !important;
            gap: 2px !important;
          }

          .mobileProductBannerTopRow {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 6px !important;
          }

          .mobileProductBannerTitle {
            font-size: 15px !important;
            font-weight: 700 !important;
            color: var(--color-text-primary, #ffffff) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            margin: 0 !important;
            line-height: 1.2 !important;
          }

          .mobileProductBannerMetaRow {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex-wrap: wrap !important;
            padding: 0 6px 6px 6px !important;
          }

          .mobileProductBannerSku {
            font-size: 11px !important;
            color: var(--color-text-secondary, #9ca3af) !important;
            margin: 0 !important;
            font-family: monospace !important;
          }

          .mobileBadgeCompact {
            font-size: 10px !important;
            font-weight: 700 !important;
            padding: 1px 6px !important;
            border-radius: 4px !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 3px !important;
          }

          .mobileBadgeActive {
            background: rgba(16, 185, 129, 0.15) !important;
            color: #10b981 !important;
            border: 1px solid rgba(16, 185, 129, 0.3) !important;
          }

          .mobileBadgeInactive {
            background: rgba(239, 68, 68, 0.15) !important;
            color: #ef4444 !important;
            border: 1px solid rgba(239, 68, 68, 0.3) !important;
          }

          /* Mostrar acordeones y controles en móvil con ancho unificado al 100% */
          .accordionToggleBarMobile {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            padding: 0 0 6px 0 !important;
            margin: 0 0 4px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .accordionToggleBtn {
            background: transparent !important;
            border: none !important;
            color: var(--color-primary, #769282) !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            padding: 2px 4px !important;
          }

          .accordionToggleSep {
            color: var(--color-border, #6b7280) !important;
            font-size: 11px !important;
          }

          .mobileAccordionsList {
            display: flex !important;
            flex-direction: column !important;
            gap: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .detailAccordionCard {
            border: 1px solid var(--color-border, #374151) !important;
            border-radius: 10px !important;
            overflow: hidden !important;
            background: var(--color-bg-secondary, #1f2937) !important;
            width: 100% !important;
            margin: 0 0 8px 0 !important;
            box-sizing: border-box !important;
          }

          .accordionHeaderButton {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 12px 14px !important;
            background: var(--color-bg-secondary, #1f2937) !important;
            border: none !important;
            color: var(--color-text-primary, #ffffff) !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            min-height: 60px !important;
            text-align: left !important;
          }

          .accordionHeaderLeft {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }

          /* Transición suave basada en CSS Grid */
          .accordionCollapsible {
            display: grid !important;
            grid-template-rows: 0fr !important;
            transition: grid-template-rows 250ms cubic-bezier(0.16, 1, 0.3, 1) !important;
          }

          .accordionCollapsibleOpen {
            grid-template-rows: 1fr !important;
          }

          .accordionCollapsibleInner {
            overflow: hidden !important;
          }

          .accordionBodyMobile {
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 14px !important;
            border-top: 1px solid var(--color-border, #374151) !important;
            background: var(--color-bg-secondary, #1f2937) !important;
          }

          /* Barra inferior pegajosa */
          .mobileActionsOverlay {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 50 !important;
            background: rgba(15, 23, 42, 0.92) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border-top: 1px solid var(--color-border, #374151) !important;
            padding: 10px 16px calc(10px + env(safe-area-inset-bottom)) 16px !important;
          }

          .mobileActionsContainer {
            display: flex !important;
            gap: 10px !important;
            width: 100% !important;
          }

          .mobileActionsContainer button {
            flex: 1 !important;
            min-height: 44px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
          }
        }

        /* 💻 ESCRITORIO (>=1024px): Pestañas tradicionales */
        @media (min-width: 1024px) {
          .mobileOnlyHeader,
          .accordionToggleBarMobile,
          .mobileAccordionsList,
          .mobileActionsOverlay {
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

          .desktopOnlyHeader {
            display: flex !important;
          }
        }
      `}</style>

      {/* 📱 Banner Compacto Móvil */}
      <div className="mobileOnlyHeader">
        {onBack && (
          <button onClick={onBack} className="mobileBackBtn" aria-label="Volver a Productos" type="button">
            <ArrowLeft size={22} />
          </button>
        )}
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="mobileProductBannerImg" />
        ) : (
          <div className="mobileProductBannerImg" />
        )}
        <div className="mobileProductBannerInfo">
          <div className="mobileProductBannerTopRow">
            <h2 className="mobileProductBannerTitle">{product.name}</h2>
          </div>
          
        </div>
      </div>

      {/* 💻 Tarjeta de Cabecera Unificada en Escritorio */}
      <div className={`${styles.headerCard} desktopOnlyHeader pdHeaderCardDesktopFixed`}>
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

      {/* ── VISTA MÓVIL: ACORDEONES VERTICALES FULL-WIDTH CON TRANSIÓN SUAVE ── */}
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

          <div className={`accordionCollapsible ${accordionsOpen.basic ? 'accordionCollapsibleOpen' : ''}`}>
            <div className="accordionCollapsibleInner">
              <div className="accordionBodyMobile">
                <Suspense fallback={<TabLoadingFallback />}>
                  <ProductDetailBasic product={product} />
                </Suspense>
              </div>
            </div>
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

          <div className={`accordionCollapsible ${accordionsOpen.pricing ? 'accordionCollapsibleOpen' : ''}`}>
            <div className="accordionCollapsibleInner">
              <div className="accordionBodyMobile">
                <Suspense fallback={<TabLoadingFallback />}>
                  <ProductDetailPricing product={product} />
                </Suspense>
              </div>
            </div>
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

          <div className={`accordionCollapsible ${accordionsOpen.images ? 'accordionCollapsibleOpen' : ''}`}>
            <div className="accordionCollapsibleInner">
              <div className="accordionBodyMobile">
                {(accordionsOpen.images || activeTab === 'images') && (
                  <Suspense fallback={<TabLoadingFallback />}>
                    <ProductDetailImages productId={product.id} />
                  </Suspense>
                )}
              </div>
            </div>
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

          <div className={`accordionCollapsible ${accordionsOpen.variants ? 'accordionCollapsibleOpen' : ''}`}>
            <div className="accordionCollapsibleInner">
              <div className="accordionBodyMobile">
                {(accordionsOpen.variants || activeTab === 'variants') && (
                  <Suspense fallback={<TabLoadingFallback />}>
                    <ProductDetailVariants productId={product.id} />
                  </Suspense>
                )}
              </div>
            </div>
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