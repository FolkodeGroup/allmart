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
    <nav className={`${styles.pagination} paginationIsolatedContainer`} aria-label={ariaLabel} role="navigation">
      <style>{`
        .paginationIsolatedContainer {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin-top: 16px;
        }

        /* 📱 MÓVIL Y TABLET (<768px): Muestra SOLO los controles de navegación táctiles */
        @media (max-width: 767px) {
          .paginationDesktopOnly {
            display: none !important;
          }
          .paginationMobileOnly {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            gap: 12px !important;
            padding: 8px 0 !important;
          }
          .paginationNavBtnMobile {
            flex: 1 !important;
            min-height: 44px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            background: var(--color-primary, #769282) !important;
            color: #ffffff !important;
            border: none !important;
            border-radius: 8px !important;
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
            white-space: nowrap !important;
          }
        }

        /* 💻 ESCRITORIO (>=768px): Oculta completamente los controles móviles */
        @media (min-width: 768px) {
          .paginationMobileOnly {
            display: none !important;
          }
          .paginationDesktopOnly {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
          }
          .pageBtnDesktop {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 32px !important;
            height: 32px !important;
            padding: 0 10px !important;
            border-radius: 6px !important;
            border: 1px solid var(--color-border, #374151) !important;
            background: var(--color-bg-secondary, #28353d) !important;
            color: var(--color-text-primary, #ffffff) !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
          }
          .pageBtnDesktop:hover:not(:disabled) {
            background: var(--color-primary, #769282) !important;
            border-color: var(--color-primary, #769282) !important;
            color: #ffffff !important;
          }
          .pageBtnDesktopActive {
            background: var(--color-primary, #769282) !important;
            border-color: var(--color-primary, #769282) !important;
            color: #ffffff !important;
          }
          .pageBtnDesktop:disabled {
            opacity: 0.35 !important;
            cursor: not-allowed !important;
          }
          .pageEllipsis {
            padding: 0 4px !important;
            color: var(--color-text-secondary, #9ca3af) !important;
            font-size: 13px !important;
          }
        }
      `}</style>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Página {page} de {totalPages}
      </div>

      {/* 📱 CONTROLES MÓVIL (<768px) */}
      <div className="paginationMobileOnly">
        <button
          className="paginationNavBtnMobile"
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
          className="paginationNavBtnMobile"
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

      {/* 💻 CONTROLES ESCRITORIO (>=768px) */}
      <div className="paginationDesktopOnly" role="group" aria-label="Números de página">
        <button
          className="pageBtnDesktop"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          onKeyDown={(e) => handleKeyDown(e, page - 1)}
          aria-label="Página anterior"
          type="button"
        >
          <ChevronLeft size={15} aria-hidden="true" />
          <span style={{ marginLeft: 4 }}>Anterior</span>
        </button>

        {getPageNumbers().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="pageEllipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`pageBtnDesktop ${page === p ? 'pageBtnDesktopActive' : ''}`}
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

        <button
          className="pageBtnDesktop"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          onKeyDown={(e) => handleKeyDown(e, page + 1)}
          aria-label="Página siguiente"
          type="button"
        >
          <span style={{ marginRight: 4 }}>Siguiente</span>
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};