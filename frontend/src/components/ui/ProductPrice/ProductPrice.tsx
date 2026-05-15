import React from "react";
import styles from "./ProductPrice.module.css";

export interface ProductPriceProps {
  price: number;
  originalPrice?: number;
  discount?: number;
  discountAmount?: number;
  promotionType?: string;
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
  discountAmount,
  promotionType,
  className = "",
  size = "md",
}) => {
  let badge: string | null = null;
  let showBadge = false;

  if (promotionType === 'percentage' && discount && discount > 0 && originalPrice && originalPrice > price) {
    badge = `-${Math.round(discount)}%`;
    showBadge = true;
  } else if (promotionType === 'fixed' && discountAmount && discountAmount > 0 && originalPrice && originalPrice > price) {
    badge = `-$${discountAmount.toFixed(2)}`;
    showBadge = true;
  } else if (promotionType === 'bogo' && originalPrice && originalPrice > price) {
    badge = '2x1';
    showBadge = true;
  }

  return (
    <div className={`${styles.priceBlock} ${styles[size]} ${className}`.trim()}>
      <span className={styles.currentPrice}>{formatPrice(price)}</span>
      {originalPrice && originalPrice > price && (
        <>
          <span className={styles.originalPrice}>{formatPrice(originalPrice)}</span>
          {showBadge && (
            <span className={styles.discountBadge}>{badge}</span>
          )}
        </>
      )}
    </div>
  );
};
