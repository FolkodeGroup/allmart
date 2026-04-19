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
  scrollPreserveKey?: string;
}

export const ProductListPanel = React.forwardRef<HTMLDivElement, ProductListPanelProps>(
  ({
    products,
    loading,
    error,
    selectedProductId,
    onSelectProduct,
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
        <div className={styles.listContainer}>
          {products.map((product) => (
            <div
              key={product.id}
              data-product-id={product.id}
              className={`${styles.productWrapper} ${
                selectedProductId === product.id ? styles.selected : ''
              }`}
              role="button"
              tabIndex={0}
              aria-label={`Seleccionar producto ${product.name}`}
              onClick={() => handleSelectProduct(product.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleSelectProduct(product.id);
                }
              }}
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
                    <span className={styles.sku}>{product.sku || 'Sin SKU'}</span>
                    <span className={styles.separator}>·</span>
                    <span>{product.category?.name || 'Sin categoría'}</span>
                  </div>

                  <div className={styles.priceLine}>
                    <strong>{currencyFormatter.format(product.price)}</strong>
                    {!!product.discount && product.discount > 0 && (
                      <span className={styles.discount}>-{product.discount}%</span>
                    )}
                    <span className={styles.stockText}>Stock: {product.stock}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }
);

ProductListPanel.displayName = 'ProductListPanel';
