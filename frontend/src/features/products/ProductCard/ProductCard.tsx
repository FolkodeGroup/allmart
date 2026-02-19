import { Link } from "react-router-dom";
import type { Product } from "../../../types";
import { Badge } from "../../../components/ui/Badge/Badge";
import styles from "./ProductCard.module.css";
import { Button } from "../../../components/ui/Button/Button";

interface ProductCardProps {
  product: Product;
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discount && product.discount > 0;
  const isNew = product.tags.includes("nuevo");

  return (
    <article className={styles.card} aria-label={product.name}>
      <div className={styles.imageWrapper}>
        <Link to={`/producto/${product.slug}`}>
          <img
            className={styles.image}
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        </Link>
        <div className={styles.badges}>
          {hasDiscount && (
            <Badge className={styles.badge} variant="discount">
              -{product.discount}%
            </Badge>
          )}
          {isNew && <Badge variant="new">Nuevo</Badge>}
        </div>
        <button
          className={styles.wishlistBtn}
          aria-label={`Agregar ${product.name} a favoritos`}
          type="button"
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
          <span className={styles.price}>{formatPrice(product.price)}</span>
          {hasDiscount && product.originalPrice && (
            <span className={styles.originalPrice}>
              {formatPrice(product.originalPrice)}
            </span>
          )}
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
