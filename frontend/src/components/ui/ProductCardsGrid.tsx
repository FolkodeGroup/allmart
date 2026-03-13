import React from 'react';
import styles from '../../features/admin/products/AdminProducts.module.css';

interface ProductCardsGridProps {
  children: React.ReactNode;
}

export const ProductCardsGrid: React.FC<ProductCardsGridProps> = ({ children }) => (
  <section className={styles.cardsGrid} aria-label="Listado de productos">
    {children}
  </section>
);
