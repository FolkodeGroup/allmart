/**
 * components/CollectionSlider.tsx
 * Carrusel infinito de productos para colecciones públicas.
 */

import React, { useEffect, useId, useRef, useState } from 'react';
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

interface SlideItem {
  key: string;
  originalIndex: number;
  product: CollectionProduct;
}

const AUTOPLAY_INTERVAL_MS = 3200;
const TRANSITION_DURATION_MS = 560;

function getResponsiveValues(viewportWidth: number) {
  if (viewportWidth < 640) {
    return { visibleSlides: 1, gapPx: 12 };
  }

  if (viewportWidth < 900) {
    return { visibleSlides: 2, gapPx: 14 };
  }

  if (viewportWidth < 1200) {
    return { visibleSlides: 3, gapPx: 16 };
  }

  return { visibleSlides: 5, gapPx: 20 };
}

const CollectionSlider: React.FC<Props> = ({
  title,
  description,
  products,
  bannerUrl,
  onProductClick,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const resetAnimationFrameRef = useRef<number | null>(null);
  const titleId = useId();
  const [visibleSlides, setVisibleSlides] = useState(5);
  const [gapPx, setGapPx] = useState(20);
  const [slideWidth, setSlideWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);

  const slidesPerView = Math.max(1, Math.min(visibleSlides, products.length || 1));
  const shouldLoop = products.length > slidesPerView;
  const cloneCount = shouldLoop ? Math.min(visibleSlides, products.length) : 0;

  const leadingClones: SlideItem[] = shouldLoop
    ? products.slice(-cloneCount).map((product, index) => ({
        key: `${product.id}-clone-start-${index}`,
        originalIndex: products.length - cloneCount + index,
        product,
      }))
    : [];

  const trailingClones: SlideItem[] = shouldLoop
    ? products.slice(0, cloneCount).map((product, index) => ({
        key: `${product.id}-clone-end-${index}`,
        originalIndex: index,
        product,
      }))
    : [];

  const baseSlides: SlideItem[] = products.map((product, index) => ({
    key: `${product.id}-original-${index}`,
    originalIndex: index,
    product,
  }));

  const slides: SlideItem[] = shouldLoop
    ? [...leadingClones, ...baseSlides, ...trailingClones]
    : baseSlides;

  const isPaused = hoverPaused || focusPaused;
  const translateX = currentIndex * (slideWidth + gapPx);

  const syncViewportMetrics = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const { visibleSlides: nextVisibleSlides, gapPx: nextGapPx } = getResponsiveValues(window.innerWidth);
    const viewportWidth = viewportRef.current?.clientWidth ?? 0;

    setVisibleSlides(nextVisibleSlides);
    setGapPx(nextGapPx);

    if (viewportWidth > 0) {
      // Always size slides based on the full responsive count so cards are
      // the same width regardless of how many products the collection has.
      // When products < nextVisibleSlides the track uses justify-content:center.
      const nextSlideWidth = (viewportWidth - nextGapPx * (nextVisibleSlides - 1)) / nextVisibleSlides;
      setSlideWidth(nextSlideWidth);
    }
  };

  const resetTrackPosition = (nextIndex: number) => {
    setTransitionEnabled(false);
    setCurrentIndex(nextIndex);

    if (typeof window === 'undefined') {
      return;
    }

    if (resetAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(resetAnimationFrameRef.current);
    }

    resetAnimationFrameRef.current = window.requestAnimationFrame(() => {
      resetAnimationFrameRef.current = window.requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    });
  };

  useEffect(() => {
    syncViewportMetrics();

    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('resize', syncViewportMetrics);

    return () => {
      window.removeEventListener('resize', syncViewportMetrics);
    };
  }, [products.length]);

  useEffect(() => {
    resetTrackPosition(shouldLoop ? cloneCount : 0);
  }, [cloneCount, shouldLoop, products]);

  useEffect(() => {
    if (!shouldLoop || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }, AUTOPLAY_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPaused, shouldLoop]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && resetAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(resetAnimationFrameRef.current);
      }
    };
  }, []);

  const goToPrevious = () => {
    if (!shouldLoop) {
      return;
    }

    setCurrentIndex((prevIndex) => prevIndex - 1);
  };

  const goToNext = () => {
    if (!shouldLoop) {
      return;
    }

    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const handleProductClick = (productSlug: string) => {
    if (onProductClick) {
      onProductClick(productSlug);
    }
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    if (target.dataset.fallbackApplied === 'true') {
      return;
    }

    target.dataset.fallbackApplied = 'true';
    target.src = DEFAULT_IMAGE_PLACEHOLDER;
  };

  if (!products || products.length === 0) {
    return null;
  }

  const handleTrackTransitionEnd = () => {
    if (!shouldLoop) {
      return;
    }

    if (currentIndex >= products.length + cloneCount) {
      resetTrackPosition(cloneCount);
      return;
    }

    if (currentIndex < cloneCount) {
      resetTrackPosition(products.length + cloneCount - 1);
    }
  };

  return (
    <div className={styles.container}>
      {bannerUrl && (
        <div className={styles.banner}>
          <img src={bannerUrl} alt={title} />
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>

      <div
        className={`${styles.carousel} ${!shouldLoop ? styles.carouselStatic : ''}`}
        role="region"
        aria-roledescription="carrusel"
        aria-labelledby={titleId}
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
        onFocusCapture={() => setFocusPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocusPaused(false);
          }
        }}
      >
        {shouldLoop && (
          <button
            className={`${styles.navButton} ${styles.navLeft}`}
            type="button"
            onClick={goToPrevious}
            aria-label={`Ver productos anteriores de ${title}`}
          >
            ‹
          </button>
        )}

        <div className={styles.viewport} ref={viewportRef} style={{ paddingTop: `${gapPx / 2}px`, paddingBottom: `${gapPx / 2}px` }}>
          <div
            className={`${styles.track} ${!shouldLoop ? styles.trackStatic : ''}`}
            style={{
              backgroundColor: 'transparent',
              gap: `${gapPx}px`,
              transform: `translateX(-${translateX}px)`,
              transition: transitionEnabled
                ? `transform ${TRANSITION_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : 'none',
            }}
            onTransitionEnd={handleTrackTransitionEnd}
            aria-live={isPaused ? 'polite' : 'off'}
          >
            {slides.map((slide, index) => {
              const imageUrl = normalizeImageUrl(slide.product.imageUrl) ?? DEFAULT_IMAGE_PLACEHOLDER;
              const isVisible = index >= currentIndex && index < currentIndex + slidesPerView;

              return (
                <article
                  key={slide.key}
                  className={styles.slide}
                  style={{ width: slideWidth > 0 ? `${slideWidth}px` : undefined, paddingTop: '10px', paddingBottom: '10px', backgroundColor: 'transparent' }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${slide.originalIndex + 1} de ${products.length}`}
                  aria-hidden={!isVisible}
                >
                  <button
                    type="button"
                    className={styles.productCard}
                    onClick={() => handleProductClick(slide.product.slug)}
                    tabIndex={isVisible ? 0 : -1}
                  >
                    <div className={styles.imageWrapper}>
                      <img
                        src={imageUrl}
                        alt={slide.product.name}
                        className={styles.productImage}
                        loading="lazy"
                        onError={handleImageError}
                      />
                    </div>

                    <div className={styles.productInfo}>
                      <h3>{slide.product.name}</h3>
                      <p className={styles.price}>
                        ${slide.product.price}
                      </p>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        {shouldLoop && (
          <button
            className={`${styles.navButton} ${styles.navRight}`}
            type="button"
            onClick={goToNext}
            aria-label={`Ver más productos de ${title}`}
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
};

export default CollectionSlider;
