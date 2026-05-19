
import { useEffect, useState } from "react";
import { ProductImage } from '../../../components/ui/ProductImage';
import { Link } from "react-router-dom";
import type { Product } from "../../../types";
import { Badge } from "../../../components/ui/Badge/Badge";
import { ProductPrice } from '../../../components/ui/ProductPrice/ProductPrice';
import DiscountBadge from '../../../components/DiscountBadge';
import { publicCollectionsService, type ProductDiscount } from '../../../services/publicCollectionsService';
import styles from "./ProductCard.module.css";
import { Button } from "../../../components/ui/Button/Button";
import { LOW_STOCK_THRESHOLD } from '../../../constants/inventory';
import { isLowStock } from '../../../utils/inventory';
import { AlertTriangle, Heart } from 'lucide-react';
import { useFavorites } from '../../../components/layout/context/FavoritesContextUtils';


interface ProductCardProps {
  product: Product & { stock?: number };
  variant?: 'default' | 'featured';
}

const FEATURED_GALLERY_AUTOPLAY_MS = 2800;

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}


export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const galleryImages = product.images?.length ? product.images : [undefined];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dynamicDiscount, setDynamicDiscount] = useState<ProductDiscount | null>(null);
  const { isFavorite, toggleFavorite, syncFavorite } = useFavorites();
  const isFavorito = isFavorite(product.id);

  // Cargar descuento dinámico desde API
  useEffect(() => {
    const loadDiscount = async () => {
      try {
        const categoryIds = Array.isArray(product.categoryIds)
          ? product.categoryIds
          : product.category?.id
            ? [product.category.id]
            : [];
        const discount = await publicCollectionsService.getProductDiscount(
          product.id,
          product.price,
          categoryIds
        );
        setDynamicDiscount(discount);
      } catch (error) {
        // Silent error - fallback a descuento estático
        console.error('Error loading discount:', error);
      }
    };

    loadDiscount();
  }, [product.id, product.price, product.category?.id, product.categoryIds]);

  const isNew = product.tags.includes("nuevo");
  const isFeatured = variant === 'featured';
  const hasGallery = isFeatured && galleryImages.length > 1;

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product.id, galleryImages.length]);

  useEffect(() => {
    if (!hasGallery) return;
    const intervalId = window.setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
    }, FEATURED_GALLERY_AUTOPLAY_MS);
    return () => window.clearInterval(intervalId);
  }, [galleryImages.length, hasGallery]);

  useEffect(() => {
    if (!isFavorito) {
      return;
    }

    syncFavorite(product);
  }, [isFavorito, product, syncFavorite]);


  const toggleFavorito = (e:React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  const goToImage = (index: number) => {
    if (!hasGallery) return;
    const nextIndex = (index + galleryImages.length) % galleryImages.length;
    if (nextIndex === currentImageIndex) return;
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
    >
      <div
        className={`${styles.imageWrapper} ${isFeatured ? styles.featuredImageWrapper : ''}`}
        role={hasGallery ? 'group' : undefined}
        aria-roledescription={hasGallery ? 'carousel' : undefined}
        aria-label={hasGallery ? `Galería de imágenes de ${product.name}` : undefined}
        onKeyDown={hasGallery ? handleGalleryKeyDown : undefined}
      >
        <Link to={`/producto/${product.slug}`}>
          {hasGallery ? (
            <div className={styles.featuredImageStage}>
              {galleryImages.map((img, idx) => (
                <ProductImage
                  key={`${product.id}-gallery-${idx}`}
                  src={img}
                  alt={`${product.name} - imagen ${idx + 1} de ${galleryImages.length}`}
                  className={
                    styles.image +
                    ' ' +
                    styles.galleryImage +
                    ' ' +
                    (idx === currentImageIndex ? styles.galleryImageActive : styles.galleryImageInactive)
                  }
                  width={isFeatured ? 420 : undefined}
                  height={isFeatured ? 320 : undefined}
                  placeholder={'data:image/svg+xml,%3Csvg width="240" height="180" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="240" height="180" fill="%23f3f3f3"/%3E%3C/svg%3E'}
                  style={{ position: 'absolute', inset: 0 }}
                  loading="eager"
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
                />
              ))}
            </div>
          ) : (
            <ProductImage
              src={galleryImages[currentImageIndex]}
              alt={product.name}
              className={styles.image}
              width={isFeatured ? 420 : undefined}
              height={isFeatured ? 320 : undefined}
              placeholder={'data:image/svg+xml,%3Csvg width="240" height="180" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="240" height="180" fill="%23f3f3f3"/%3E%3C/svg%3E'}
              loading={isFeatured ? 'eager' : 'lazy'}
              fetchPriority={isFeatured ? 'high' : 'auto'}
              sizes={isFeatured ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px' : '(max-width: 768px) 50vw, 240px'}
            />
          )}
        </Link>

        {/* Mostrar DiscountBadge según el tipo de promoción */}
        {dynamicDiscount && (
          <DiscountBadge
            discountPercentage={dynamicDiscount?.promotionType === 'percentage' ? dynamicDiscount.discountPercentage : undefined}
            discountAmount={dynamicDiscount?.promotionType === 'fixed' ? dynamicDiscount.discountAmount : undefined}
            promotionType={dynamicDiscount?.promotionType}
          />
        )}
        {hasGallery && (
          <>
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
          {isNew && <Badge variant="new">Nuevo</Badge>}
          {typeof product.stock === 'number' && isLowStock(product.stock, LOW_STOCK_THRESHOLD) && (
            <Badge className={`${styles.badge} ${styles.lowStockBadge}`}>
              <AlertTriangle size={16} style={{marginRight: 4}} /> Stock bajo
            </Badge>
          )}
        </div>
        <button
          className={`${styles.wishlistBtn} ${isFavorito ? styles.activo : ""}`}
          aria-label={isFavorito ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
          type="button"
          onClick={toggleFavorito}
        >
          <Heart size={18} fill={isFavorito ? 'currentColor' : 'transparent'} aria-hidden="true" />
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
                {dynamicDiscount ? (
                  <ProductPrice
                    price={dynamicDiscount.finalPrice}
                    size="md"
                  />
                ) : (
                  <ProductPrice
                    price={product.price}
                    size="md"
                  />
                )}
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