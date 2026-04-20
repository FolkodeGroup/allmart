import React, { useRef, useEffect, useMemo } from 'react';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { PackageSearch, AlertCircle, Pencil, Copy, Trash2 } from 'lucide-react';
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
  onDuplicate?: (product: AdminProduct) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  scrollPreserveKey?: string;
}

export const ProductListPanel = React.forwardRef<HTMLDivElement, ProductListPanelProps>(
  ({
    products,
    loading,
    error,
    selectedProductId,
    onSelectProduct,
    onEdit,
    onDelete,
    onDuplicate,
    canEdit = true,
    canDelete = true,
    scrollPreserveKey = 'product-list-scroll',
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const currencyFormatter = useMemo(
      () => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }),
      []
    );

    // Preserve scroll position
    useEffect(() => {
      const scrollPos = sessionStorage.getItem(scrollPreserveKey);
      if (scrollPos && containerRef.current) {
        containerRef.current.scrollTop = parseInt(scrollPos, 10);
      }
    }, [scrollPreserveKey]);


    const handleSelectProduct = (id: string) => {
      onSelectProduct(id);
    };

    // Keyboard navigation: arrow keys to move between products
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
      <aside ref={ref || containerRef} className={styles.panel} onScroll={handleScroll}>
        <div className={styles.listContainer} role="listbox" aria-label="Lista de productos">
          {products.map((product, index) => (
            <div
              key={product.id}
              data-product-id={product.id}
              className={`${styles.productWrapper} ${
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
                  className={styles.thumbnail}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_IMAGE_PLACEHOLDER;
                  }}
                />

                <div className={styles.content}>
                  <div className={styles.headerLine}>
                    <h3 className={styles.title}>{product.name}</h3>
                    <span className={`${styles.stockBadge} ${product.inStock ? styles.inStock : styles.outOfStock}`}>
                      {product.inStock ? 'Disponible' : 'Sin stock'}
                    </span>
                  </div>

                  <div className={styles.metaLine}>
                    <span className={styles.sku} title={`SKU: ${product.sku || 'Sin SKU'}`}>{product.sku || 'Sin SKU'}</span>
                    <span className={styles.separator}>·</span>
                    <span title={product.category?.name || 'Sin categoría'}>{product.category?.name || 'Sin categoría'}</span>
                  </div>

                  <div className={styles.priceLine}>
                    <strong>{currencyFormatter.format(product.price)}</strong>
                    {!!product.discount && product.discount > 0 && product.originalPrice && (
                      <span className={styles.originalPrice}>{currencyFormatter.format(product.originalPrice)}</span>
                    )}
                    {!!product.discount && product.discount > 0 && (
                      <span className={styles.discount}>-{product.discount}%</span>
                    )}
                    <span className={styles.stockText}>Stock: {product.stock}</span>
                  </div>
                </div>
              </div>

              {/* Quick actions on hover */}
              <div className={styles.quickActions}>
                {canEdit && onEdit && (
                  <button
                    className={styles.quickBtn}
                    title="Editar"
                    onClick={(e) => { e.stopPropagation(); onEdit(product.id); }}
                    aria-label={`Editar ${product.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {onDuplicate && (
                  <button
                    className={styles.quickBtn}
                    title="Duplicar"
                    onClick={(e) => { e.stopPropagation(); onDuplicate(product); }}
                    aria-label={`Duplicar ${product.name}`}
                  >
                    <Copy size={14} />
                  </button>
                )}
                {canDelete && onDelete && (
                  <button
                    className={`${styles.quickBtn} ${styles.quickBtnDanger}`}
                    title="Eliminar"
                    onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                    aria-label={`Eliminar ${product.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }
);

ProductListPanel.displayName = 'ProductListPanel';
