import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../features/admin/products/AdminProducts.module.css';

interface ProductPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({ page, totalPages, onPageChange }) => {
  const handleKeyDown = (e: React.KeyboardEvent, pageNum: number) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onPageChange(pageNum);
    }
  };

  // Show limited page range around current page
  const getPageNumbers = () => {
    const delta = 2;
    const pages: (number | 'ellipsis')[] = [];
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push('ellipsis');
    }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) {
      if (right < totalPages - 1) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav
      className={styles.pagination}
      aria-label="Paginación de productos"
      role="navigation"
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Página {page} de {totalPages}
      </div>

      <button
        className={styles.pageBtn}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        onKeyDown={(e) => handleKeyDown(e, page - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
        <span>Anterior</span>
      </button>

      <div className={styles.pageNumbers} role="group" aria-label="Números de página">
        {getPageNumbers().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className={styles.ellipsis} aria-hidden="true">…</span>
          ) : (
            <button
              key={p}
              className={`${styles.pageBtn} ${page === p ? styles.pageActive : ''}`}
              onClick={() => onPageChange(p)}
              onKeyDown={(e) => handleKeyDown(e, p)}
              aria-current={page === p ? 'page' : undefined}
              aria-label={`Ir a la página ${p}${page === p ? ' (actual)' : ''}`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        className={styles.pageBtn}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        onKeyDown={(e) => handleKeyDown(e, page + 1)}
        aria-label="Página siguiente"
      >
        <span>Siguiente</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};
