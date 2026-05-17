import React from "react";
import styles from "./ProductPrice.module.css";

export interface ProductPriceProps {
  price: number;
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
  className = "",
  size = "md",
}) => {
  return (
    <div className={`${styles.priceBlock} ${styles[size]} ${className}`.trim()}>
      <span className={styles.currentPrice}>{formatPrice(price)}</span>
    </div>
  );
};
