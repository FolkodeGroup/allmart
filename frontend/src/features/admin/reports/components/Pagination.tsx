import React from 'react';
import styles from '../AdminReports.module.css';

export interface PaginationProps {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
}) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const canPrev = page > 1;
    const canNext = page < totalPages;

    // Show up to 5 page numbers, with ellipsis if needed
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (end - start < 4) {
        if (start === 1) end = Math.min(totalPages, start + 4);
        else if (end === totalPages) start = Math.max(1, end - 4);
    }
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <nav className={styles.pagination} aria-label="Paginación">
            <div className={styles.paginationLeft}>
                {onPageSizeChange && (
                    <label className={styles.pageSizeLabel}>
                        <span>Mostrar</span>
                        <select
                            className={styles.pageSizeSelect}
                            value={pageSize}
                            onChange={e => onPageSizeChange(Number(e.target.value))}
                            aria-label="Elementos por página"
                        >
                            {pageSizeOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <span>por página</span>
                    </label>
                )}
            </div>
            <div className={styles.paginationCenter}>
                <button
                    className={styles.pageBtn}
                    onClick={() => canPrev && onPageChange(page - 1)}
                    disabled={!canPrev}
                    aria-label="Anterior"
                >
                    <span className={styles.pageBtnIcon}>‹</span>
                </button>
                {start > 1 && <span className={styles.ellipsis}>…</span>}
                {pages.map(p => (
                    <button
                        key={p}
                        className={p === page ? styles.pageBtnActive : styles.pageBtn}
                        onClick={() => onPageChange(p)}
                        aria-current={p === page ? 'page' : undefined}
                    >
                        {p}
                    </button>
                ))}
                {end < totalPages && <span className={styles.ellipsis}>…</span>}
                <button
                    className={styles.pageBtn}
                    onClick={() => canNext && onPageChange(page + 1)}
                    disabled={!canNext}
                    aria-label="Siguiente"
                >
                    <span className={styles.pageBtnIcon}>›</span>
                </button>
            </div>
            <span className={styles.pageInfo}>
                Página {page} de {totalPages} ({total} registros)
            </span>
        </nav>
    );
};
