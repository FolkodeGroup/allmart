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

const Slider: React.FC<SliderProps> = ({ products, itemsPerPage = 4 }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages) return;
    setCurrentPage(page);
  };

  const handlePrev = () => goToPage(currentPage - 1);
  const handleNext = () => goToPage(currentPage + 1);

  const startIdx = currentPage * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const visibleProducts = products.slice(startIdx, endIdx);

  return (
    <div className={styles.sliderContainer}>
      {/* Flecha izquierda */}
      {currentPage > 0 && (
        <button className={`${styles.sliderArrow} ${styles.sliderArrowLeft}`} onClick={handlePrev} aria-label="Anterior">
          &#8592;
        </button>
      )}

      {/* Track de productos */}
      <div className={styles.sliderTrack} style={{ transform: `translateX(-${currentPage * 100}%)` }}>
        {visibleProducts.map((product) => {
          const hasDiscount = product.discount && product.discount > 0;
          const isNew = product.tags.includes('nuevo');
          return (
            <div className={styles.sliderCard} key={product.id}>
              <div style={{ position: 'relative' }}>
                <img
                  className={styles.sliderImage}
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                />
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
                  {hasDiscount && (
                    <span style={{ background: '#e7b17a', color: '#fff', borderRadius: 8, padding: '2px 8px', fontWeight: 600, fontSize: 14 }}>
                      -{product.discount}%
                    </span>
                  )}
                  {isNew && (
                    <span style={{ background: '#a67c52', color: '#fff', borderRadius: 8, padding: '2px 8px', fontWeight: 600, fontSize: 14 }}>
                      Nuevo
                    </span>
                  )}
                </div>
                <button
                  style={{ position: 'absolute', top: 12, right: 12, background: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                  aria-label={`Agregar ${product.name} a favoritos`}
                  type="button"
                >
                  ♡
                </button>
              </div>
              <div style={{ padding: '16px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ color: '#a67c52', fontSize: 13, fontWeight: 500 }}>{product.category.name}</span>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{product.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888' }}>
                  <span>★ {product.rating.toFixed(1)}</span>
                  <span>({product.reviewCount})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>
                    {product.price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                  </span>
                  {hasDiscount && product.originalPrice && (
                    <span style={{ textDecoration: 'line-through', color: '#bdbdbd', fontSize: 15 }}>
                      {product.originalPrice.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flecha derecha */}
      {currentPage < totalPages - 1 && (
        <button className={`${styles.sliderArrow} ${styles.sliderArrowRight}`} onClick={handleNext} aria-label="Siguiente">
          &#8594;
        </button>
      )}

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
