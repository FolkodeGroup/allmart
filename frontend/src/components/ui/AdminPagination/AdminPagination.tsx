import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './AdminPagination.module.css';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  ariaLabel = 'Paginación',
}) => {
  if (totalPages <= 1) return null;

  const handleKeyDown = (e: React.KeyboardEvent, pageNum: number) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onPageChange(pageNum);
    }
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
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
    <nav className={`${styles.pagination} paginationMobileWrapper`} aria-label={ariaLabel} role="navigation">
      <style>{`
        @media (max-width: 767px) {
          .paginationMobileWrapper {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 10px !important;
            width: 100% !important;
            padding: 12px 0 24px 0 !important;
          }
          .paginationMobileControls {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            gap: 12px !important;
          }
          .paginationNavBtnMobile {
            flex: 1 !important;
            min-height: 44px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            background: var(--color-primary, #28353d) !important;
            color: var(--color-text-primary, #ffffff) !important;
            border: 1px solid var(--color-border, #374151) !important;
            border-radius: 10px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
          }
          .paginationNavBtnMobile:disabled {
            opacity: 0.4 !important;
            cursor: not-allowed !important;
          }
          .paginationMobileText {
            font-size: 13px !important;
            font-weight: 600 !important;
            color: var(--color-text-secondary, #9ca3af) !important;
          }
          .pageNumbersDesktop {
            display: none !important;
          }
        }
        @media (min-width: 768px) {
          .pageNumbersDesktop {
            display: flex !important;
          }
        }
      `}</style>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Página {page} de {totalPages}
      </div>

      <div className="paginationMobileControls">
        <button
          className={`${styles.pageBtn} ${styles.navBtn} paginationNavBtnMobile`}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          onKeyDown={(e) => handleKeyDown(e, page - 1)}
          aria-label="Página anterior"
          type="button"
        >
          <ChevronLeft size={18} aria-hidden="true" />
          <span>Anterior</span>
        </button>

        <span className="paginationMobileText">
          Página {page} de {totalPages}
        </span>

        <button
          className={`${styles.pageBtn} ${styles.navBtn} paginationNavBtnMobile`}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          onKeyDown={(e) => handleKeyDown(e, page + 1)}
          aria-label="Página siguiente"
          type="button"
        >
          <span>Siguiente</span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Números de página solo para escritorio */}
      <div className={`${styles.pageNumbers} pageNumbersDesktop`} role="group" aria-label="Números de página">
        {getPageNumbers().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className={styles.ellipsis} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`${styles.pageBtn} ${page === p ? styles.pageActive : ''}`}
              onClick={() => onPageChange(p)}
              onKeyDown={(e) => handleKeyDown(e, p)}
              aria-current={page === p ? 'page' : undefined}
              aria-label={`Ir a la página ${p}${page === p ? ' (actual)' : ''}`}
              type="button"
            >
              {p}
            </button>
          )
        )}
      </div>
    </nav>
  );
};