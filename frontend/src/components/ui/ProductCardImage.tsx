import React from 'react';
import { ProductImage } from './ProductImage';
import styles from '../../features/admin/products/AdminProductCard.module.css';

interface ProductCardImageProps {
  src?: string;
  alt: string;
}

export const ProductCardImage: React.FC<ProductCardImageProps> = ({ src, alt }) => (
  <div className={styles.imageWrapper}>
    {src ? (
      <ProductImage
        src={src}
        alt={alt}
        className={styles.image}
        width={240}
        height={180}
        placeholder={'data:image/svg+xml,%3Csvg width="240" height="180" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="240" height="180" fill="%23f3f3f3"/%3E%3C/svg%3E'}
      />
    ) : (
      <div
        className={styles.noImage}
        role="img"
        aria-label={`Sin imagen de ${alt}`}
      >Sin imagen</div>
    )}
  </div>
);
