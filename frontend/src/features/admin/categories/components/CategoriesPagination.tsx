import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../AdminCategories.module.css';

interface CategoriesPaginationProps {
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export const CategoriesPagination: React.FC<CategoriesPaginationProps> = ({
  page,
  totalPages,
  loading,
  onPageChange,
}) => {

  const safeTotalPages = Math.max(1, totalPages);

  const handleKeyDown = (e: React.KeyboardEvent, pageNum: number) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onPageChange(pageNum);
    }
  };

  // 🔥 MISMA lógica que productos
  const getPageNumbers = () => {
    const delta = 2;
    const pages: (number | 'ellipsis')[] = [];

    const left = Math.max(1, page - delta);
    const right = Math.min(safeTotalPages, page + delta);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push('ellipsis');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < safeTotalPages) {
      if (right < safeTotalPages - 1) pages.push('ellipsis');
      pages.push(safeTotalPages);
    }

    return pages;
  };

  return (
    <nav
      className={styles.pagination}
      aria-label="Paginación de categorías"
      role="navigation"
    >
      {/* Screen reader */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Página {page} de {safeTotalPages}
      </div>

      {/* Anterior */}
      <button
        className={styles.pageBtn}
        disabled={page === 1 || loading}
        onClick={() => onPageChange(page - 1)}
        onKeyDown={(e) => handleKeyDown(e, page - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
        <span>Anterior</span>
      </button>

      {/* 🔥 NÚMEROS (IGUAL QUE PRODUCTOS) */}
      <div
        className={styles.pageNumbers}
        role="group"
        aria-label="Números de página"
      >
        {getPageNumbers().map((p, idx) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className={styles.ellipsis}
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              className={`${styles.pageBtn} ${page === p ? styles.pageActive : ''
                }`}
              disabled={loading}
              onClick={() => onPageChange(p)}
              onKeyDown={(e) => handleKeyDown(e, p)}
              aria-current={page === p ? 'page' : undefined}
              aria-label={`Ir a la página ${p}${page === p ? ' (actual)' : ''
                }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Siguiente */}
      <button
        className={styles.pageBtn}
        disabled={page === safeTotalPages || loading}
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