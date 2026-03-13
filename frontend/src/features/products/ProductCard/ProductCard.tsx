
import { useState, useEffect } from "react";
import { ProductImage } from '../../../components/ui/ProductImage';
import { Link } from "react-router-dom";
import type { Product } from "../../../types";
import { Badge } from "../../../components/ui/Badge/Badge";
import { ProductPrice } from '../../../components/ui/ProductPrice/ProductPrice';
import styles from "./ProductCard.module.css";
import { Button } from "../../../components/ui/Button/Button";
import { LOW_STOCK_THRESHOLD } from '../../../constants/inventory';
import { isLowStock } from '../../../utils/inventory';
import { AlertTriangle } from 'lucide-react';


interface ProductCardProps {
  product: Product & { stock?: number };
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}


export function ProductCard({ product }: ProductCardProps) {
  const storageKey = `wishlist-${product.id}`;
  const [isFavorito, setIsFavorito] = useState<boolean>(() => {
    if (typeof window === "undefined") return false; // Seguridad por si usas SSR (Next.js)
    const saved = localStorage.getItem(storageKey);
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isFavorito));
  }, [isFavorito, storageKey]);

  const hasDiscount = product.discount && product.discount > 0;
  const isNew = product.tags.includes("nuevo");

  const toggleFavorito = (e:React.MouseEvent) => {
    e.preventDefault();
    setIsFavorito(!isFavorito);
  };

  return (
    <article className={styles.card} aria-label={product.name}>
      <div className={styles.imageWrapper}>
        <Link to={`/producto/${product.slug}`}>
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            className={styles.image}
            width={240}
            height={180}
            placeholder={'data:image/svg+xml,%3Csvg width="240" height="180" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="240" height="180" fill="%23f3f3f3"/%3E%3C/svg%3E'}
          />
        </Link>
        <div className={styles.badges}>
          {hasDiscount && (
            <Badge className={styles.badge} variant="discount">
              -{product.discount}%
            </Badge>
          )}
          {isNew && <Badge variant="new">Nuevo</Badge>}
          {typeof product.stock === 'number' && isLowStock(product.stock, LOW_STOCK_THRESHOLD) && (
            <Badge className={`${styles.badge} ${styles.lowStockBadge}`}>
              <AlertTriangle size={16} style={{marginRight: 4}} /> Stock bajo
            </Badge>
          )}
        </div>
        <button
          className={`${styles.wishlistBtn} ${isFavorito ? styles.activo : ""}`}
          aria-label={`Agregar ${product.name} a favoritos`}
          type="button"
          onClick={toggleFavorito}
        >
          ♡
        </button>
      </div>

      <div className={styles.body}>
        <span className={styles.category}>{product.category.name}</span>
        <h3 className={styles.name}>
          <Link to={`/producto/${product.slug}`}>{product.name}</Link>
        </h3>
        <div
          className={styles.rating}
          aria-label={`Valoración: ${product.rating} de 5`}
        >
          <span className={styles.stars}>{renderStars(product.rating)}</span>
          <span>({product.reviewCount})</span>
        </div>
        <div className={styles.priceRow}>
            <ProductPrice
              price={product.price}
              originalPrice={product.originalPrice}
              discount={product.discount}
              size="md"
            />
        </div>
      </div>
      <Link className={styles.exploreButton} to={`/productos?category=${product.category.slug}`}>
        <Button className={styles.ButtonExplore} variant="primary" size="lg">
          Explorar catálogo
        </Button>
      </Link>
    </article>
  );
}
//Las Cards estan alineadas no hubo modificaciones