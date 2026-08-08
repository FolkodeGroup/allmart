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
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
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
          /* 🟢 FIX ESCRITORIO: Tarjetas ultra-compactas sin SKU ni Categoría */
          .prodListContainerClean {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding-bottom: 0 !important;
          }
          .prodListCompactRow {
            padding: 8px 10px !important;
            border-radius: 10px !important;
            margin-bottom: 0 !important;
            transition: all 0.15s ease !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
          }
          .prodListCompactThumb {
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
            border-radius: 6px !important;
            object-fit: cover !important;
          }
          .prodListCompactTitle {
            font-size: 13px !important;
            font-weight: 600 !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          /* 💻 ESCRITORIO (>= 1024px): Eliminación de doble barra de scroll */
          @media (min-width: 1024px) {
            .productListPanelDesktopClean {
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              box-sizing: border-box !important;
              padding-right: 0 !important;
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
              <div className={styles.mainRow}>
                <img
                  src={normalizeImageUrl(product.images?.[0]) ?? DEFAULT_IMAGE_PLACEHOLDER}
                  alt={product.name}
                  className={`${styles.thumbnail} prodListCompactThumb`}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_IMAGE_PLACEHOLDER;
                  }}
                />

                <div className={styles.content}>
                  <div className={styles.headerLine}>
                    <h3 className={`${styles.title} prodListCompactTitle`}>{product.name}</h3>
                  </div>

                  {/* 🟢 SKU y Categoría removidos para máxima síntesis visual */}

                  <div className={styles.priceLine}>
                    <strong>{currencyFormatter.format(product.price)}</strong>
                    <div className={styles.stockSection}>
                      <span
                        className={`${styles.stockBadge} ${
                          product.inStock ? styles.inStock : styles.outOfStock
                        }`}
                      >
                        {product.inStock ? 'Disponible' : 'Sin stock'}
                      </span>

                      <span className={styles.stockText}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick actions on hover */}
              <div className={styles.quickActions}>
                {canEdit && onEdit && (
                  <button
                    type="button"
                    className={styles.quickBtn}
                    title="Editar"
                    onClick={(e) => { e.stopPropagation(); onEdit(product.id); }}
                    aria-label={`Editar ${product.name}`}
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <i className="bi bi-pencil-fill" />
                  </button>
                )}
                {canDelete && onDelete && (
                  <button
                    type="button"
                    className={`${styles.quickBtn} ${styles.quickBtnDanger}`}
                    title="Eliminar"
                    onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                    aria-label={`Eliminar ${product.name}`}
                    style={{ color: 'var(--color-error)' }}
                  >
                    <i className="bi bi-trash-fill" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }
));

ProductListPanel.displayName = 'ProductListPanel';