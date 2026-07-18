/**
 * components/BannerSlider.tsx
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './BannerSlider.module.css';
import type { PublicBanner } from '../services/publicBannersService';
import { DEFAULT_IMAGE_PLACEHOLDER, normalizeImageUrl } from '../utils/imageUrl';
import { useNavigate } from 'react-router-dom';
import { bannerFilterToUrl } from '../utils/bannerFilterToUrl';

interface Props {
  banners: PublicBanner[];
}

const BannerSlider: React.FC<Props> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    if (target.dataset.fallbackApplied === 'true') {
      return;
    }
    target.dataset.fallbackApplied = 'true';
    target.src = DEFAULT_IMAGE_PLACEHOLDER;
  };

  const startAutoAdvance = useCallback(() => {
    if (banners.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
  }, [banners.length]);

  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoAdvance]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    startAutoAdvance();
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    startAutoAdvance();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    startAutoAdvance();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // 🟢 SOLUCIÓN CLS: Si no hay banners cargados, devolvemos un Skeleton Placeholder con el aspect-ratio correcto
  if (!banners || banners.length === 0) {
    return (
      <div className={styles.sliderPlaceholder} aria-hidden="true">
        <div className={styles.slidesContainerPlaceholder}></div>
      </div>
    );
  }

  function handleBannerClick(banner: PublicBanner) {
    const url = bannerFilterToUrl(banner.filterConfig ?? {});
    navigate(url);
  }

  return (
    <div className={styles.slider}>
      <div
        className={styles.slidesContainer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label="Carrusel de banners"
      >
        {banners.map((banner, index) => {
          const imageUrl = normalizeImageUrl(banner.imageUrl) ?? DEFAULT_IMAGE_PLACEHOLDER;

          return (
            <div
              key={banner.id}
              className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
              aria-hidden={index !== currentIndex}
              onClick={() => handleBannerClick(banner)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.slideContent}>
                <img
                  src={imageUrl}
                  alt={banner.altText || banner.title}
                  className={styles.bannerImage}
                  onError={handleImageError}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  width="1186"
                  height="667"
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
              </div>
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          <button
            className={`${styles.navButton} ${styles.prevButton}`}
            onClick={goToPrevious}
            aria-label="Banner anterior"
            type="button"
          >
            ‹
          </button>
          <button
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={goToNext}
            aria-label="Siguiente banner"
            type="button"
          >
            ›
          </button>

          <div className={styles.dots}>
            {banners.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir al banner ${index + 1}`}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerSlider;