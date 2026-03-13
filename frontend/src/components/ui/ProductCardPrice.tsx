import React from 'react';
import styles from '../../features/admin/products/AdminProductCard.module.css';

interface ProductCardPriceProps {
  price: number;
  discount?: number;
}

export const ProductCardPrice: React.FC<ProductCardPriceProps> = ({ price, discount }) => {
  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
  return (
    <div className={styles.priceRow}>
      <span className={styles.price}>{formatPrice(price)}</span>
      {discount && discount > 0 && (
        <span className={styles.discount}>-{discount}% OFF</span>
      )}
    </div>
  );
};
