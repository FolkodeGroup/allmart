/**
 * components/CollectionSlider.tsx
 * Componente reutilizable para mostrar colecciones de productos con carrusel.
 */

import React, { useState } from 'react';
import styles from './CollectionSlider.module.css';

export interface CollectionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
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
  const [scrollPos, setScrollPos] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = 300;
    const newPos =
      direction === 'left' ? scrollPos - scrollAmount : scrollPos + scrollAmount;
    containerRef.current.scrollLeft = newPos;
    setScrollPos(newPos);
  };

  const handleProductClick = (productSlug: string) => {
    if (onProductClick) {
      onProductClick(productSlug);
    }
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

      <div className={styles.sliderWrapper}>
        <button
          className={`${styles.navButton} ${styles.navLeft}`}
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          ◄
        </button>

        <div className={styles.slider} ref={containerRef}>
          {products.map((product) => (
            <div
              key={product.id}
              className={styles.productCard}
              onClick={() => handleProductClick(product.slug)}
            >
              {product.imageUrl && (
                <div className={styles.imageWrapper}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className={styles.productImage}
                  />
                </div>
              )}

              <div className={styles.productInfo}>
                <h3>{product.name}</h3>
                <p className={styles.price}>${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          className={`${styles.navButton} ${styles.navRight}`}
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          ►
        </button>
      </div>
    </div>
  );
};

export default CollectionSlider;
