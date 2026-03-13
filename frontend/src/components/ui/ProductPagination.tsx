import React from 'react';
import styles from '../../features/admin/products/AdminProducts.module.css';

interface ProductPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({ page, totalPages, onPageChange }) => (
  <nav
    className={styles.pagination}
    style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
    aria-label="Paginación de productos"
  >
    <button
      className={styles.pageBtn}
      disabled={page === 1}
      onClick={() => onPageChange(page - 1)}
      aria-label="Página anterior"
    >Anterior</button>
    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i + 1}
        className={styles.pageBtn + (page === i + 1 ? ' ' + styles.pageActive : '')}
        onClick={() => onPageChange(i + 1)}
        aria-current={page === i + 1 ? 'page' : undefined}
        aria-label={`Ir a la página ${i + 1}`}
      >{i + 1}</button>
    ))}
    <button
      className={styles.pageBtn}
      disabled={page === totalPages}
      onClick={() => onPageChange(page + 1)}
      aria-label="Página siguiente"
    >Siguiente</button>
  </nav>
);
