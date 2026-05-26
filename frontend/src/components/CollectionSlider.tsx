/**
 * components/CollectionSlider.tsx
 * Carrusel de productos estilo MercadoLibre — identidad visual Allmart.
 *
 * Layout:
 *  ┌─────────────────────────────────────────────────────┐
 *  │  Título colección              Ver todos →           │
 *  ├──── ‹ ──────────── [cards ×N] ──────── › ──────────┤
 *  └─────────────────────────────────────────────────────┘
 *
 * Flechas: circulares, fuera del viewport, Allmart accent border.
 * Cards:   blancas, borde sutil, hover shadow + lift.
 * Precio:  formateado con separadores (es-AR).
 * Mobile:  flechas ocultas, swipe nativo (overflow-x scroll + snap).
 */

import React, { useEffect, useId, useRef, useState, useCallback } from 'react';
import styles from './CollectionSlider.module.css';
import { DEFAULT_IMAGE_PLACEHOLDER, normalizeImageUrl } from '../utils/imageUrl';

export interface CollectionProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  imageUrl?: string | { url?: unknown } | null;
  position: number;
}

interface Props {
  title: string;
  description?: string;
  products: CollectionProduct[];
  bannerUrl?: string;
  onProductClick?: (productSlug: string) => void;
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const TRANSITION_MS = 480;

function getLayout(vw: number): { visible: number; gap: number } {
  if (vw < 480) return { visible: 1, gap: 12 };
  if (vw < 768) return { visible: 2, gap: 14 };
  if (vw < 1024) return { visible: 3, gap: 16 };
  if (vw < 1400) return { visible: 4, gap: 18 };
  return { visible: 5, gap: 20 };
}

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return String(price);
  return num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Componente ────────────────────────────────────────────────────────────────
const CollectionSlider: React.FC<Props> = ({
  title,
  products,
  bannerUrl,
  onProductClick,
}) => {
  const titleId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const [layout, setLayout] = useState<{ visible: number; gap: number }>({ visible: 5, gap: 20 });
  const [slideW, setSlideW] = useState(0);
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Clones para loop infinito
  const count = products.length;
  const canLoop = count > layout.visible;
  const clones = canLoop ? Math.min(layout.visible, count) : 0;

  type SlideItem = { key: string; product: CollectionProduct; origIdx: number };
  const leadingClones: SlideItem[] = canLoop
    ? products.slice(-clones).map((p, i) => ({
        key: `clone-start-${i}`,
        product: p,
        origIdx: count - clones + i,
      }))
    : [];
  const trailingClones: SlideItem[] = canLoop
    ? products.slice(0, clones).map((p, i) => ({
        key: `clone-end-${i}`,
        product: p,
        origIdx: i,
      }))
    : [];
  const baseSlides: SlideItem[] = products.map((p, i) => ({
    key: `orig-${i}`,
    product: p,
    origIdx: i,
  }));
  const slides: SlideItem[] = canLoop
    ? [...leadingClones, ...baseSlides, ...trailingClones]
    : baseSlides;

  // ─── Métricas responsive ────────────────────────────────────────────────────
  const syncMetrics = useCallback(() => {
    const vw = window.innerWidth;
    const newLayout = getLayout(vw);
    const vpW = viewportRef.current?.clientWidth ?? 0;
    const mobile = vw < 768;
    setIsMobile(mobile);
    setLayout(newLayout);
    if (vpW > 0) {
      const w = (vpW - newLayout.gap * (newLayout.visible - 1)) / newLayout.visible;
      setSlideW(w);
    }
  }, []);

  useEffect(() => {
    syncMetrics();
    window.addEventListener('resize', syncMetrics);
    return () => window.removeEventListener('resize', syncMetrics);
  }, [syncMetrics, count]);

  // Posición inicial (tras los leading clones)
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

  // ─── Navegación ─────────────────────────────────────────────────────────────
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.currentTarget;
    if (t.dataset.fb === '1') return;
    t.dataset.fb = '1';
    t.src = DEFAULT_IMAGE_PLACEHOLDER;
  };

  if (!products || products.length === 0) return null;

  const translateX = index * (slideW + layout.gap);

  return (
    <div className={styles.root}>
      {bannerUrl && (
        <div className={styles.banner}>
          <img src={bannerUrl} alt={title} />
        </div>
      )}

      {/* ── Cabecera: título + "Ver todos" ── */}
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <a
          href={`/productos?coleccion=${encodeURIComponent(title)}`}
          className={styles.viewAll}
          aria-label={`Ver todos los productos de ${title}`}
        >
          Ver todos
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      {/* ── Carrusel: flechas + viewport ── */}
      <div
        className={styles.carouselWrapper}
        role="region"
        aria-roledescription="carrusel"
        aria-labelledby={titleId}
      >
        {/* Flecha izquierda — oculta en mobile */}
        {canLoop && !isMobile && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => goTo(-1)}
            aria-label={`Ver productos anteriores de ${title}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Viewport — móvil: scroll nativo; desktop: transform */}
        <div
          ref={viewportRef}
          className={`${styles.viewport} ${isMobile ? styles.mobileScroll : ''}`}
        >
          {isMobile ? (
            /* ── Mobile: scroll horizontal nativo con snap ── */
            <div className={styles.mobileTrack} style={{ gap: `${layout.gap}px` }}>
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  total={products.length}
                  width={slideW}
                  onClick={onProductClick}
                  onImageError={handleImageError}
                />
              ))}
            </div>
          ) : (
            /* ── Desktop: transform carrusel con clones ── */
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
                  <ProductCard
                    key={slide.key}
                    product={slide.product}
                    index={slide.origIdx}
                    total={count}
                    width={slideW}
                    isHidden={!visible}
                    onClick={onProductClick}
                    onImageError={handleImageError}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Flecha derecha — oculta en mobile */}
        {canLoop && !isMobile && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => goTo(1)}
            aria-label={`Ver más productos de ${title}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── ProductCard ───────────────────────────────────────────────────────────────
interface CardProps {
  product: CollectionProduct;
  index: number;
  total: number;
  width: number;
  isHidden?: boolean;
  onClick?: (slug: string) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const ProductCard: React.FC<CardProps> = ({
  product,
  index,
  total,
  width,
  isHidden,
  onClick,
  onImageError,
}) => {
  const imageUrl = normalizeImageUrl(product.imageUrl) ?? DEFAULT_IMAGE_PLACEHOLDER;
  return (
    <article
      className={styles.slide}
      style={{ width: width > 0 ? `${width}px` : undefined }}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} de ${total}: ${product.name}`}
      aria-hidden={isHidden}
    >
      <button
        type="button"
        className={styles.card}
        onClick={() => onClick?.(product.slug)}
        tabIndex={isHidden ? -1 : 0}
        aria-label={`Ver ${product.name}`}
      >
        {/* Imagen */}
        <div className={styles.imgWrapper}>
          <img
            src={imageUrl}
            alt={product.name}
            className={styles.img}
            loading="lazy"
            onError={onImageError}
          />
        </div>

        {/* Info */}
        <div className={styles.info}>
          <p className={styles.name}>{product.name}</p>
          <p className={styles.price}>
            <span className={styles.priceSymbol}>$</span>
            {formatPrice(product.price)}
          </p>
        </div>
      </button>
    </article>
  );
};

export default CollectionSlider;
