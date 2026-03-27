
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
  variant?: 'default' | 'featured';
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}


export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const storageKey = `wishlist-${product.id}`;
  const galleryImages = product.images?.length ? product.images : [undefined];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
  const isFeatured = variant === 'featured';
  const hasGallery = isFeatured && galleryImages.length > 1;

  const toggleFavorito = (e:React.MouseEvent) => {
    e.preventDefault();
    setIsFavorito(!isFavorito);
  };

  const goToImage = (index: number) => {
    if (!hasGallery) return;
    const nextIndex = (index + galleryImages.length) % galleryImages.length;
    setCurrentImageIndex(nextIndex);
  };

  const handleGalleryKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!hasGallery) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToImage(currentImageIndex + 1);
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToImage(currentImageIndex - 1);
    }
  };

  return (
    <article
      className={`${styles.card} ${isFeatured ? styles.featuredCard : ''}`}
      aria-label={product.name}
      onKeyDown={handleGalleryKeyDown}
    >
      <div
        className={`${styles.imageWrapper} ${isFeatured ? styles.featuredImageWrapper : ''}`}
        role={hasGallery ? 'group' : undefined}
        aria-roledescription={hasGallery ? 'carousel' : undefined}
        aria-label={hasGallery ? `Galería de imágenes de ${product.name}` : undefined}
      >
        <Link to={`/producto/${product.slug}`}>
          <ProductImage
            src={galleryImages[currentImageIndex]}
            alt={`${product.name}${hasGallery ? ` - imagen ${currentImageIndex + 1} de ${galleryImages.length}` : ''}`}
            className={styles.image}
            width={isFeatured ? 420 : 240}
            height={isFeatured ? 320 : 180}
            placeholder={'data:image/svg+xml,%3Csvg width="240" height="180" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="240" height="180" fill="%23f3f3f3"/%3E%3C/svg%3E'}
            loading={isFeatured ? 'eager' : 'lazy'}
            fetchPriority={isFeatured ? 'high' : 'auto'}
            sizes={isFeatured ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px' : '(max-width: 768px) 50vw, 240px'}
          />
        </Link>

        {hasGallery && (
          <>
            <button
              type="button"
              className={`${styles.galleryNav} ${styles.galleryPrev}`}
              aria-label="Imagen anterior"
              onClick={(event) => {
                event.preventDefault();
                goToImage(currentImageIndex - 1);
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.galleryNav} ${styles.galleryNext}`}
              aria-label="Siguiente imagen"
              onClick={(event) => {
                event.preventDefault();
                goToImage(currentImageIndex + 1);
              }}
            >
              ›
            </button>
            <div className={styles.galleryDots} role="group" aria-label="Selector de imagen">
              {galleryImages.map((_, index) => (
                <button
                  key={`${product.id}-img-dot-${index}`}
                  type="button"
                  className={`${styles.galleryDot} ${currentImageIndex === index ? styles.galleryDotActive : ''}`}
                  aria-label={`Ver imagen ${index + 1}`}
                  aria-current={currentImageIndex === index ? 'true' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    goToImage(index);
                  }}
                />
              ))}
            </div>
          </>
        )}

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
      <Link
        className={`${styles.exploreButton} ${isFeatured ? styles.featuredExploreButton : ''}`}
        to={`/producto/${product.slug}`}
      >
        <Button className={styles.ButtonExplore} variant="primary" size="lg">
          Ver producto
        </Button>
      </Link>
    </article>
  );
}
//Las Cards estan alineadas no hubo modificaciones