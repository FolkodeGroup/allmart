import React from 'react';
import styles from '../AdminReports.module.css';

function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= 600 : false
    );
    React.useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

export interface PaginationProps {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}

/**
 * Componente de paginación para tablas de datos.
 *
 * @param page Página actual
 * @param pageSize Tamaño de página
 * @param total Total de elementos
 * @param onPageChange Callback para cambiar de página
 * @param onPageSizeChange Callback para cambiar tamaño de página
 * @param pageSizeOptions Opciones de tamaño de página
 */
export const Pagination: React.FC<PaginationProps> = ({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
}) => {
    const isMobile = useIsMobile();
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const canPrev = page > 1;
    const canNext = page < totalPages;

    // Mobile: solo anterior/siguiente + página actual, botones grandes, selector arriba
    if (isMobile) {
        return (
            <nav className={styles.pagination} aria-label="Paginación" style={{ flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                {onPageSizeChange && (
                    <label className={styles.pageSizeLabel} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span>Mostrar</span>
                        <select
                            className={styles.pageSizeSelect}
                            value={pageSize}
                            onChange={e => onPageSizeChange(Number(e.target.value))}
                            aria-label="Elementos por página"
                            style={{ flex: 1, minWidth: 0 }}
                        >
                            {pageSizeOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <span>por página</span>
                    </label>
                )}
                <div className={styles.paginationCenter} style={{ justifyContent: 'center', gap: 8, width: '100%' }}>
                    <button
                        className={styles.pageBtn}
                        onClick={() => canPrev && onPageChange(page - 1)}
                        disabled={!canPrev}
                        aria-label="Anterior"
                        style={{ minWidth: 44, minHeight: 44, fontSize: 18 }}
                    >‹</button>
                    <span className={styles.pageInfo} style={{ fontSize: 15, margin: '0 8px', minWidth: 80, textAlign: 'center' }}>
                        Página {page} de {totalPages}
                    </span>
                    <button
                        className={styles.pageBtn}
                        onClick={() => canNext && onPageChange(page + 1)}
                        disabled={!canNext}
                        aria-label="Siguiente"
                        style={{ minWidth: 44, minHeight: 44, fontSize: 18 }}
                    >›</button>
                </div>
                <span className={styles.pageInfo} style={{ textAlign: 'center', fontSize: 13, marginTop: 4 }}>
                    ({total} registros)
                </span>
            </nav>
        );
    }

    // Desktop igual que antes
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
        <nav
            className={styles.pagination}
            aria-label="Paginación"
            style={isMobile ? { flexDirection: 'column', alignItems: 'center', gap: 8 } : {}}
        >
            <div className={styles.paginationLeft} style={isMobile ? { justifyContent: 'center' } : {}}>
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
            <div className={styles.paginationCenter} style={isMobile ? { justifyContent: 'center', gap: 4 } : {}}>
                <button
                    className={styles.pageBtn}
                    onClick={() => canPrev && onPageChange(page - 1)}
                    disabled={!canPrev}
                    aria-label="Anterior"
                    style={isMobile ? { minWidth: 40, minHeight: 40, fontSize: 18 } : {}}
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
                        style={isMobile ? { minWidth: 40, minHeight: 40, fontSize: 18 } : {}}
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
                    style={isMobile ? { minWidth: 40, minHeight: 40, fontSize: 18 } : {}}
                >
                    <span className={styles.pageBtnIcon}>›</span>
                </button>
            </div>
            <span className={styles.pageInfo} style={isMobile ? { textAlign: 'center', fontSize: 13 } : {}}>
                Página {page} de {totalPages} ({total} registros)
            </span>
        </nav>
    );
};
