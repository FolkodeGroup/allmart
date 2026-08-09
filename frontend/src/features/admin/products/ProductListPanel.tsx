import React, { useRef, useEffect, useMemo } from 'react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { PackageSearch, AlertCircle } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';

import { DEFAULT_IMAGE_PLACEHOLDER, normalizeImageUrl } from '../../../utils/imageUrl';
import styles from './ProductListPanel.module.css';

interface ProductListPanelProps {
  products: AdminProduct[];
  loading: boolean;
  error: string | null;
  selectedProductId?: string;
  onSelectProduct: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  scrollPreserveKey?: string;
}

export const ProductListPanel = React.memo(React.forwardRef<HTMLDivElement, ProductListPanelProps>(
  ({
    products,
    loading,
    error,
    selectedProductId,
    onSelectProduct,
    onEdit: _onEdit,
    onDelete: _onDelete,
    canEdit: _canEdit = true,
    canDelete: _canDelete = true,
    scrollPreserveKey = 'product-list-scroll',
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const currencyFormatter = useMemo(
      () => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }),
      []
    );

    useEffect(() => {
      const scrollPos = sessionStorage.getItem(scrollPreserveKey);
      if (scrollPos && containerRef.current) {
        containerRef.current.scrollTop = parseInt(scrollPos, 10);
      }
    }, [scrollPreserveKey]);

    const handleSelectProduct = (id: string) => {
      onSelectProduct(id);
    };

    const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelectProduct(products[index].id);
      } else if (event.key === 'ArrowDown' && index < products.length - 1) {
        event.preventDefault();
        const nextEl = (event.currentTarget.parentElement?.children[index + 1] as HTMLElement);
        nextEl?.focus();
        handleSelectProduct(products[index + 1].id);
      } else if (event.key === 'ArrowUp' && index > 0) {
        event.preventDefault();
        const prevEl = (event.currentTarget.parentElement?.children[index - 1] as HTMLElement);
        prevEl?.focus();
        handleSelectProduct(products[index - 1].id);
      }
    };

    const handleScroll = () => {
      if (containerRef.current) {
        sessionStorage.setItem(scrollPreserveKey, containerRef.current.scrollTop.toString());
      }
    };

    if (error) {
      return (
        <aside ref={ref || containerRef} className={styles.panel}>
          <div className={styles.errorContainer}>
            <EmptyState
              icon={<AlertCircle size={48} color="#ef4444" />}
              title="Error al cargar productos"
              description={error}
            />
          </div>
        </aside>
      );
    }

    if (loading) {
      return (
        <aside ref={ref || containerRef} className={styles.panel}>
          <div className={styles.loadingContainer}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLine} style={{ width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      );
    }

    if (products.length === 0) {
      return (
        <aside ref={ref || containerRef} className={styles.panel}>
          <div className={styles.emptyContainer}>
            <EmptyState
              icon={<PackageSearch size={48} color="#94a3b8" />}
              title="No se encontraron productos"
              description="Ajusta los filtros o la búsqueda para encontrar lo que necesitás."
            />
          </div>
        </aside>
      );
    }

    return (
      <aside
        ref={ref || containerRef}
        className={`${styles.panel} productListPanelDesktopClean`}
        onScroll={handleScroll}
      >
        <style>{`
          .prodListContainerClean {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            overflow-y: visible !important;
          }

          .prodListCompactRow {
            padding: 10px 12px !important;
            border-radius: 10px !important;
            margin-bottom: 0 !important;
            transition: all 0.15s ease !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            cursor: pointer;
            border: 1px solid var(--color-border, #374151) !important;
            background-color: var(--color-bg-primary, #111827) !important;
          }

          .prodListCompactRow:hover {
            border-color: var(--color-primary, #769282) !important;
          }

          .prodListCompactRow.selected {
            border-color: var(--color-primary, #769282) !important;
            background-color: rgba(118, 146, 130, 0.15) !important;
            box-shadow: 0 0 0 1px var(--color-primary, #769282) !important;
          }

          .prodListMainRow {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }

          .prodListCompactThumb {
            width: 54px !important;
            height: 54px !important;
            min-width: 40px !important;
            border-radius: 8px !important;
            object-fit: cover !important;
            flex-shrink: 0 !important;
          }

          .prodListCompactContent {
            display: flex !important;
            flex-direction: column !important;
            gap: 4px !important;
            min-width: 0 !important;
            flex: 1 !important;
            overflow: hidden !important;
          }

          .prodListCompactTitle {
            font-size: 13px !important;
            font-weight: 700 !important;
            line-height: 1.25 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            color: var(--color-text-primary, #ffffff) !important;
            margin: 0 !important;
          }

          .prodListCompactMetaGroup {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-wrap: wrap !important;
            min-width: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .prodListCompactPrice {
            font-size: 13px !important;
            font-weight: 800 !important;
            color: var(--color-accent, #DDB08C) !important;
            white-space: nowrap !important;
          }

          .prodListCompactBadge {
            font-size: 10px !important;
            font-weight: 700 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.02em !important;
            white-space: nowrap !important;
          }

          .badgeInStock {
            background: rgba(16, 185, 129, 0.15) !important;
            color: #10b981 !important;
            border: 1px solid rgba(16, 185, 129, 0.3) !important;
          }

          .badgeOutOfStock {
            background: rgba(239, 68, 68, 0.15) !important;
            color: #ef4444 !important;
            border: 1px solid rgba(239, 68, 68, 0.3) !important;
          }

          .prodListCompactStock {
            font-size: 11px !important;
            color: var(--color-text-secondary, #9ca3af) !important;
            white-space: nowrap !important;
            font-weight: 500 !important;
          }

          @media (min-width: 1024px) {
            .productListPanelDesktopClean {
              height: 100% !important;
              min-height: 100% !important;
              max-height: none !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: flex-start !important;
              overflow: visible !important;
              overflow-y: visible !important;
              box-sizing: border-box !important;
              padding: 12px !important;
              background: var(--color-bg-secondary, #1f2937) !important;
              border: 1px solid var(--color-border, #374151) !important;
              border-radius: 12px !important;
            }
          }
        `}</style>

        <div className={`${styles.listContainer} prodListContainerClean`} role="listbox" aria-label="Lista de productos">
          {products.map((product, index) => (
            <div
              key={product.id}
              data-product-id={product.id}
              className={`${styles.productWrapper} prodListCompactRow ${
                selectedProductId === product.id ? styles.selected : ''
              }`}
              role="option"
              tabIndex={0}
              aria-label={`Seleccionar producto ${product.name}`}
              aria-selected={selectedProductId === product.id}
              onClick={() => handleSelectProduct(product.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <div className="prodListMainRow">
                <img
                  src={normalizeImageUrl(product.images?.[0]) ?? DEFAULT_IMAGE_PLACEHOLDER}
                  alt={product.name}
                  className="prodListCompactThumb"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_IMAGE_PLACEHOLDER;
                  }}
                />

                <div className="prodListCompactContent">
                  <h3 className="prodListCompactTitle" title={product.name}>
                    {product.name}
                  </h3>

                  <div className="prodListCompactMetaGroup">
                    <span className="prodListCompactPrice">
                      {currencyFormatter.format(product.price)}
                    </span>
                    <span
                      className={`prodListCompactBadge ${
                        product.inStock ? 'badgeInStock' : 'badgeOutOfStock'
                      }`}
                    >
                      {product.inStock ? 'Disponible' : 'Sin stock'}
                    </span>
                    <span className="prodListCompactStock">
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }
));

ProductListPanel.displayName = 'ProductListPanel';