import React from 'react';
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
  if (totalPages <= 1) return null;
  return (
    <nav
      className={styles.pagination}
      style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
      aria-label="Paginación de categorías"
    >
      <button
        className={styles.pageBtn}
        disabled={page === 1 || loading}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
      >Anterior</button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i + 1}
          className={styles.pageBtn + (page === i + 1 ? ' ' + styles.pageActive : '')}
          disabled={page === i + 1 || loading}
          onClick={() => onPageChange(i + 1)}
          aria-label={`Ir a la página ${i + 1}`}
          aria-current={page === i + 1 ? 'page' : undefined}
        >{i + 1}</button>
      ))}
      <button
        className={styles.pageBtn}
        disabled={page === totalPages || loading}
        onClick={() => onPageChange(page + 1)}
        aria-label="Página siguiente"
      >Siguiente</button>
    </nav>
  );
};
