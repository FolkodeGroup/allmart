import React, { useState } from "react";
import type { Product } from '../../../types';
import styles from './Slider.module.css';

/**
 * Componente Slider reutilizable para mostrar productos en formato carrousel horizontal.
 *
 * @param products Lista de productos a mostrar (tipo Product[])
 * @param itemsPerPage Cantidad de productos visibles por página (default: 4)
 */
interface SliderProps {
  /** Lista de productos a mostrar */
  products: Product[];
  /** Cantidad de productos visibles por página (default: 4) */
  itemsPerPage?: number;
}

const Slider: React.FC<SliderProps> = ({ products, itemsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // Agrupar productos en páginas
  const pages = Array.from({ length: totalPages }, (_, i) =>
    products.slice(i * itemsPerPage, i * itemsPerPage + itemsPerPage)
  );

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className={styles.sliderContainer}>
      {/* Wrapper: flecha izq + viewport + flecha der */}
      <div className={styles.sliderWrapper}>
        <button
          className={`${styles.sliderArrow} ${styles.sliderArrowLeft}`}
          onClick={() => goToPage(currentPage - 1)}
          aria-label="Anterior"
          disabled={currentPage === 0}
        >
          &#8592;
        </button>

        {/* Viewport con overflow hidden — aquí vive la transición */}
        <div className={styles.sliderViewport}>
          <div
            className={styles.sliderTrack}
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {pages.map((pageProducts, pageIdx) => (
              <div
                key={pageIdx}
                className={styles.sliderPage}
                style={{ '--items-per-page': itemsPerPage } as React.CSSProperties}
              >
                {pageProducts.map((product) => {
                  const hasDiscount = product.discount && product.discount > 0;
                  const isNew = product.tags.includes('nuevo');
                  return (
                    <div className={styles.sliderCard} key={product.id}>
                      <div className={styles.sliderImageWrapper}>
                        <img
                          className={styles.sliderImage}
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                        />
                        <div className={styles.sliderBadges}>
                          {hasDiscount && (
                            <span className={styles.badgeDiscount}>-{product.discount}%</span>
                          )}
                          {isNew && (
                            <span className={styles.badgeNew}>Nuevo</span>
                          )}
                        </div>
                        <button className={styles.wishlistBtn} aria-label={`Agregar ${product.name} a favoritos`} type="button">
                          ♡
                        </button>
                      </div>
                      <div className={styles.sliderCardBody}>
                        <span className={styles.sliderCategory}>{product.category.name}</span>
                        <h3 className={styles.sliderName}>{product.name}</h3>
                        <div className={styles.sliderRating}>
                          <span>★ {product.rating.toFixed(1)}</span>
                          <span>({product.reviewCount})</span>
                        </div>
                        <div className={styles.sliderPriceRow}>
                          <span className={styles.sliderPrice}>
                            {product.price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                          </span>
                          {hasDiscount && product.originalPrice && (
                            <span className={styles.sliderOriginalPrice}>
                              {product.originalPrice.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <button
          className={`${styles.sliderArrow} ${styles.sliderArrowRight}`}
          onClick={() => goToPage(currentPage + 1)}
          aria-label="Siguiente"
          disabled={currentPage >= totalPages - 1}
        >
          &#8594;
        </button>
      </div>

      {/* Dots de navegación */}
      <div className={styles.sliderNav}>
        {Array.from({ length: totalPages }).map((_, idx) => (
          <span
            key={idx}
            className={idx === currentPage ? `${styles.sliderDot} ${styles.sliderDotActive}` : styles.sliderDot}
            onClick={() => goToPage(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
