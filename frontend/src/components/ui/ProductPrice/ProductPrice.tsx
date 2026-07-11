import React from "react";
import type { Discount } from "../../../types";
import styles from "./ProductPrice.module.css";

export interface ProductPriceProps {
  price: number;
  discount?: Discount | null;
  discountPercentage?: number;
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
  discount,
  className = "",
  size = "md",
  discountPercentage,
}) => {
  // Si hay descuento, mostrar precio original tachado + precio con descuento
  if (discount) {
    return (
      <div className={`${styles.priceBlock} ${styles[size]} ${className}`.trim()}>
        <span className={styles.originalPrice}>{formatPrice(price)}</span>
        <div className={styles.discountedContainer}>
          <span className={styles.currentPrice}>{formatPrice(discount.finalPrice)}</span>
          {discountPercentage && (
            <span className={styles.discountBadge}>-{discountPercentage.toFixed(0)}%</span>
          )}
        </div>
      </div>
    );
  }

  // Sin descuento, mostrar solo el precio
  return (
    <div className={`${styles.priceBlock} ${styles[size]} ${className}`.trim()}>
      <span className={styles.currentPrice}>{formatPrice(price)}</span>
    </div>
  );
};
