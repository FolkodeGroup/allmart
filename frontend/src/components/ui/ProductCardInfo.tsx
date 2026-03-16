import React from 'react';
import styles from '../../features/admin/products/AdminProductCard.module.css';
import { SkuBadge } from './Badge/SkuBadge';
import { CategoryBadge } from './Badge/CategoryBadge';

interface ProductCardInfoProps {
  name: string;
  sku?: string;
  category: string;
}

export const ProductCardInfo: React.FC<ProductCardInfoProps> = ({ name, sku, category }) => (
  <>
    <div className={styles.headerRow}>
      <span className={styles.name}>{name}</span>
      {sku && <SkuBadge sku={sku} className={styles.sku} />}
    </div>
    {category && <CategoryBadge category={category} className={styles.category} />}
  </>
);
