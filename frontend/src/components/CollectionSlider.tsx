/**
 * components/CollectionSlider.tsx
 * Componente reutilizable para mostrar colecciones de productos con carrusel adaptativo.
 * - Detecta overflow: flechas solo aparecen si hay más items de los que caben
 * - Centra items si son pocos
 * - Responsive design consistente con el resto de la app
 */

import React, { useState, useEffect, useRef } from 'react';
import styles from './CollectionSlider.module.css';
import { DEFAULT_IMAGE_PLACEHOLDER, normalizeImageUrl } from '../utils/imageUrl';

export interface CollectionProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  imageUrl?: string | { url?: unknown } | null;
  position: number;
}

interface Props {
  title: string;
  description?: string;
  products: CollectionProduct[];
  bannerUrl?: string;
  onProductClick?: (productSlug: string) => void;
}

const CollectionSlider: React.FC<Props> = ({
  title,
  description,
  products,
  bannerUrl,
  onProductClick,
}) => {
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detectar overflow y capacidad de scroll
  const checkOverflow = () => {
    if (!sliderRef.current) return;

    const { scrollWidth, clientWidth, scrollLeft } = sliderRef.current;
    const hasOverflowContent = scrollWidth > clientWidth;
    
    setHasOverflow(hasOverflowContent);
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkOverflow);
    }

    return () => {
      window.removeEventListener('resize', checkOverflow);
      if (slider) {
        slider.removeEventListener('scroll', checkOverflow);
      }
    };
  }, [products.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = 320;
    const newPos =
      direction === 'left'
        ? sliderRef.current.scrollLeft - scrollAmount
        : sliderRef.current.scrollLeft + scrollAmount;
    
    sliderRef.current.scrollTo({
      left: newPos,
      behavior: 'smooth',
    });
  };

  const handleProductClick = (productSlug: string) => {
    if (onProductClick) {
      onProductClick(productSlug);
    }
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    if (target.dataset.fallbackApplied === 'true') {
      return;
    }

    target.dataset.fallbackApplied = 'true';
    target.src = DEFAULT_IMAGE_PLACEHOLDER;
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {bannerUrl && (
        <div className={styles.banner}>
          <img src={bannerUrl} alt={title} />
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>

      <div 
        className={`${styles.sliderWrapper} ${!hasOverflow ? styles.centered : ''}`}
        ref={containerRef}
      >
        {hasOverflow && (
          <button
            className={`${styles.navButton} ${styles.navLeft}`}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            disabled={!canScrollLeft}
            style={{ opacity: canScrollLeft ? 1 : 0.3 }}
          >
            ◄
          </button>
        )}

        <div 
          className={styles.slider} 
          ref={sliderRef}
          role="region"
          aria-label={`Productos de ${title}`}
        >
          {products.map((product) => {
            const imageUrl = normalizeImageUrl(product.imageUrl) ?? DEFAULT_IMAGE_PLACEHOLDER;

            return (
              <div
                key={product.id}
                className={styles.productCard}
                onClick={() => handleProductClick(product.slug)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleProductClick(product.slug);
                  }
                }}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className={styles.productImage}
                    loading="lazy"
                    onError={handleImageError}
                  />
                </div>

                <div className={styles.productInfo}>
                  <h3>{product.name}</h3>
                  <p className={styles.price}>
                    ${product.price}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {hasOverflow && (
          <button
            className={`${styles.navButton} ${styles.navRight}`}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            disabled={!canScrollRight}
            style={{ opacity: canScrollRight ? 1 : 0.3 }}
          >
            ►
          </button>
        )}
      </div>
    </div>
  );
};

export default CollectionSlider;
