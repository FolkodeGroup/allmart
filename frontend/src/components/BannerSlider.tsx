/**
 * components/BannerSlider.tsx
 * Componente para mostrar banners en un carrusel automático en la homepage.
 */

import React, { useState, useEffect } from 'react';
import styles from './BannerSlider.module.css';
import type { PublicBanner } from '../services/publicBannersService';

interface Props {
  banners: PublicBanner[];
}

const BannerSlider: React.FC<Props> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className={styles.slider}>
      <div className={styles.slidesContainer}>
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
          >
            <div className={styles.slideContent}>
              <img 
                src={banner.imageUrl} 
                alt={banner.altText || banner.title}
                className={styles.bannerImage}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows - only show if more than one banner */}
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

          {/* Dots for slide navigation */}
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
