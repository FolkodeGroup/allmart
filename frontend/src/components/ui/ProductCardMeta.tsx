import React from 'react';
import styles from '../../features/admin/products/AdminProductCard.module.css';

interface ProductCardMetaProps {
  stock: number;
  inStock: boolean;
}

export const ProductCardMeta: React.FC<ProductCardMetaProps> = ({ stock, inStock }) => (
  <div className={styles.metaRow}>
    <span className={stock > 0 ? styles.stockOk : styles.stockOut}>
      Stock: {stock}
    </span>
    <span className={inStock ? styles.statusActive : styles.statusInactive}>
      {inStock ? 'Activo' : 'Inactivo'}
    </span>
  </div>
);
