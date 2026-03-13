import React from 'react';
import styles from '../../features/admin/products/AdminProductCard.module.css';

interface ProductCardInfoProps {
  name: string;
  sku?: string;
  category: string;
}

export const ProductCardInfo: React.FC<ProductCardInfoProps> = ({ name, sku, category }) => (
  <>
    <div className={styles.headerRow}>
      <span className={styles.name}>{name}</span>
      {sku && <span className={styles.sku}>SKU: {sku}</span>}
    </div>
    <div className={styles.category}>{category}</div>
  </>
);
