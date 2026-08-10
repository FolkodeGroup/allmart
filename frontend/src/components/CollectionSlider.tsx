/**
 * components/CollectionSlider.tsx
 * Carrusel de productos estilo MercadoLibre — identidad visual Allmart.
 */

import React, { useEffect, useId, useRef, useState, useCallback } from 'react';
import styles from './CollectionSlider.module.css';
import '../styles/collections.css';
import { normalizeImageUrl, type ImageUrlCandidate } from '../utils/imageUrl';
import { resolveImageUrl } from '../utils/imageHelpers';
import { ProductCard as StandardProductCard } from '../features/products/ProductCard/ProductCard';
import type { Product } from '../types';

export interface CollectionProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  imageUrl?: string | { url?: unknown } | null;
  position: number;
  category?: string | { name?: string; slug?: string } | null;
}

interface Props {
  title: string;
  slug: string;
  description?: string;
  products: CollectionProduct[];
  bannerUrl?: string;
  showViewAll?: boolean;
  previewMode?: boolean;
  variant?: 'home' | 'category';
}

const TRANSITION_MS = 480;

function getLayout(vw: number): { visible: number; gap: number } {
  if (vw < 480) return { visible: 2, gap: 12 };
  if (vw < 768) return { visible: 2, gap: 14 };
  if (vw < 1024) return { visible: 3, gap: 16 };
  if (vw < 1400) return { visible: 4, gap: 18 };
  return { visible: 5, gap: 20 };
}

function buildProductCardProduct(product: CollectionProduct): Product {
  const categoryName = typeof product.category === 'string'
    ? product.category
    : product.category && typeof product.category === 'object' && product.category.name
      ? product.category.name
      : 'Sin categoría';

  const normalizedImage = normalizeImageUrl(product.imageUrl as ImageUrlCandidate | undefined);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.name,
    shortDescription: product.name,
    price: Number(product.price) || 0,
    images: normalizedImage ? [normalizedImage] : [],
    category: {
      id: `collection-${product.id}`,
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'sin-categoria',
      isVisible: true,
    },
    categoryId: undefined,
    categoryIds: [],
    categories: [],
    tags: [],
    rating: 0,
    reviewCount: 0,
    inStock: true,
    sku: product.id,
    selectedAttributes: {},
    appliedDiscount: null,
  };
}

const CollectionSlider: React.FC<Props> = ({
  title,
  slug,
  products,
  bannerUrl,
  showViewAll = true,
  previewMode = false,
  variant: _variant = 'home',
}) => {
  const titleId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const [layout, setLayout] = useState<{ visible: number; gap: number }>({ visible: 5, gap: 20 });
  const [slideW, setSlideW] = useState(0);
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const effectiveProducts = products;
  const count = effectiveProducts.length;
  const canLoop = count > layout.visible;
  const clones = canLoop ? Math.min(layout.visible, count) : 0;
  const cardWidth = slideW;

  type SlideItem = { key: string; product: CollectionProduct; origIdx: number };
  const leadingClones: SlideItem[] = canLoop
    ? effectiveProducts.slice(-clones).map((p, i) => ({
      key: `clone-start-${i}`,
      product: p,
      origIdx: count - clones + i,
    }))
    : [];
  const trailingClones: SlideItem[] = canLoop
    ? effectiveProducts.slice(0, clones).map((p, i) => ({
      key: `clone-end-${i}`,
      product: p,
      origIdx: i,
    }))
    : [];
  const baseSlides: SlideItem[] = effectiveProducts.map((p, i) => ({
    key: `orig-${i}`,
    product: p,
    origIdx: i,
  }));
  const slides: SlideItem[] = canLoop
    ? [...leadingClones, ...baseSlides, ...trailingClones]
    : baseSlides;

  const syncMetrics = useCallback(() => {
    const vw = window.innerWidth;
    const newLayout = getLayout(vw);
    const vpW = viewportRef.current?.clientWidth ?? 0;
    const mobile = vw < 768;
    setIsMobile(mobile);
    setLayout(newLayout);
    if (vpW > 0) {
      if (mobile) {
        // En móvil, se calcula un ancho de ~150px - 175px para permitir ver 2 cards completas + 20% de asomado de la 3ª card
        const calcWidth = Math.min(175, Math.max(150, Math.floor((vpW - newLayout.gap * 1.5) / 2.2)));
        setSlideW(calcWidth);
      } else {
        const w = (vpW - newLayout.gap * (newLayout.visible - 1)) / newLayout.visible;
        setSlideW(w);
      }
    }
  }, []);

  useEffect(() => {
    syncMetrics();
    window.addEventListener('resize', syncMetrics);
    return () => window.removeEventListener('resize', syncMetrics);
  }, [syncMetrics, count]);

  useEffect(() => {
    setTransitioning(false);
    setIndex(canLoop ? clones : 0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() =>
      requestAnimationFrame(() => setTransitioning(true))
    );
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clones, canLoop, count]);

  const goTo = useCallback((dir: 1 | -1) => {
    if (!canLoop) return;
    setIndex((prev) => prev + dir);
  }, [canLoop]);

  const handleTransitionEnd = useCallback(() => {
    if (!canLoop) return;
    if (index >= count + clones) {
      setTransitioning(false);
      setIndex(clones);
      requestAnimationFrame(() => requestAnimationFrame(() => setTransitioning(true)));
    } else if (index < clones) {
      setTransitioning(false);
      setIndex(count + clones - 1);
      requestAnimationFrame(() => requestAnimationFrame(() => setTransitioning(true)));
    }
  }, [canLoop, index, count, clones]);

  if (!effectiveProducts || effectiveProducts.length === 0) return null;

  const translateX = index * (slideW + layout.gap);

  return (
    <div className={styles.root}>
      {bannerUrl && (
        <div className={styles.banner}>
          <img src={resolveImageUrl(bannerUrl) ?? bannerUrl} alt={title} />
        </div>
      )}

      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        {showViewAll && (
          previewMode ? (
            <span className={styles.viewAll} style={{ opacity: 0.85, cursor: 'default' }}>
              Ver todos
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          ) : (
            <a
              href={`/productos?coleccion=${encodeURIComponent(slug)}`}
              className={styles.viewAll}
              aria-label={`Ver todos los productos de ${title}`}
            >
              Ver todos
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )
        )}
      </div>

      <div
        className={styles.carouselWrapper}
        role="region"
        aria-roledescription="carrusel"
        aria-labelledby={titleId}
      >
        {canLoop && !isMobile && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => goTo(-1)}
            aria-label={`Ver productos anteriores de ${title}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div
          ref={viewportRef}
          className={`${styles.viewport} ${isMobile ? styles.mobileScroll : ''}`}
        >
          {isMobile ? (
            <div className={styles.mobileTrack} style={{ gap: `${layout.gap}px` }}>
              {effectiveProducts.map((product, i) => (
                <div
                  key={product.id}
                  className={styles.slide}
                  style={{ width: cardWidth > 0 ? `${cardWidth}px` : undefined }}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} de ${effectiveProducts.length}: ${product.name}`}
                >
                  <StandardProductCard product={buildProductCardProduct(product)} variant="featured" />
                </div>
              ))}
            </div>
          ) : (
            <div
              className={styles.track}
              style={{
                gap: `${layout.gap}px`,
                transform: `translateX(-${translateX}px)`,
                transition: transitioning ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22,1,0.36,1)` : 'none',
              }}
              onTransitionEnd={handleTransitionEnd}
              aria-live="off"
            >
              {slides.map((slide, i) => {
                const visible = i >= index && i < index + layout.visible;
                return (
                  <div
                    key={slide.key}
                    className={styles.slide}
                    style={{ width: cardWidth > 0 ? `${cardWidth}px` : undefined }}
                    aria-roledescription="slide"
                    aria-label={`${slide.origIdx + 1} de ${count}: ${slide.product.name}`}
                    aria-hidden={!visible}
                  >
                    <StandardProductCard product={buildProductCardProduct(slide.product)} variant="featured" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canLoop && !isMobile && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => goTo(1)}
            aria-label={`Ver más productos de ${title}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default CollectionSlider;