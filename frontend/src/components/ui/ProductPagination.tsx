import React from 'react';
import styles from '../../features/admin/products/AdminProducts.module.css';

interface ProductPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}


export const ProductPagination: React.FC<ProductPaginationProps> = ({ page, totalPages, onPageChange }) => {
  const handleKeyDown = (e: React.KeyboardEvent, pageNum: number) => {
    // Space and Enter trigger page change
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onPageChange(pageNum);
    }
  };

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  return (
    <nav
      className={styles.pagination}
      style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
      aria-label="Paginación de productos"
      role="navigation"
    >
      {/* ARIA live region for page change announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Página {page} de {totalPages}
      </div>

      <button
        className={styles.pageBtn}
        disabled={page === 1}
        onClick={handlePrevious}
        onKeyDown={(e) => handleKeyDown(e, page - 1)}
        aria-label="Página anterior"
        title="Ir a la página anterior (Flecha izquierda)"
      >
        ← Anterior
      </button>

      <div className={styles.pageNumbers} role="group" aria-label="Números de página">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={styles.pageBtn + (page === i + 1 ? ' ' + styles.pageActive : '')}
            onClick={() => onPageChange(i + 1)}
            onKeyDown={(e) => handleKeyDown(e, i + 1)}
            aria-current={page === i + 1 ? 'page' : undefined}
            aria-label={`Ir a la página ${i + 1}${page === i + 1 ? ' (actual)' : ''}`}
            title={`Página ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        className={styles.pageBtn}
        disabled={page === totalPages}
        onClick={handleNext}
        onKeyDown={(e) => handleKeyDown(e, page + 1)}
        aria-label="Página siguiente"
        title="Ir a la página siguiente (Flecha derecha)"
      >
        Siguiente →
      </button>
    </nav>
  );
};
