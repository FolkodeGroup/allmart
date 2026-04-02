import React from "react";
import styles from "./ProductPrice.module.css";

export interface ProductPriceProps {
  price: number;
  originalPrice?: number;
  discount?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

export const ProductPrice: React.FC<ProductPriceProps> = ({
  price,
  originalPrice,
  discount,
  className = "",
  size = "md",
}) => {
  const hasDiscount = Boolean(discount && discount > 0 && originalPrice && originalPrice > price);
  const percent = hasDiscount ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : 0;

  return (
    <div className={`${styles.priceBlock} ${styles[size]} ${className}`.trim()}>
      <span className={styles.currentPrice}>{formatPrice(price)}</span>
      {hasDiscount && (
        <>
          <span className={styles.originalPrice}>{formatPrice(originalPrice!)}</span>
          <span className={styles.discountBadge}>
            {percent > 0 ? `-${percent}%` : `SALE`}
          </span>
        </>
      )}
    </div>
  );
};
