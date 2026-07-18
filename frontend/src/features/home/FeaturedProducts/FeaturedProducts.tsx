// frontend/src/features/home/FeaturedProducts/FeaturedProducts.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../../types';
import {
  fetchPublicProducts,
  mapApiProductToProduct,
} from '../../../services/productsService';
import { fetchPublicCategories } from '../../../services/categoriesService';
import { ProductCard } from '../../products/ProductCard/ProductCard';
import { Button } from '../../../components/ui/Button/Button';
import { publicCollectionsService, type ActiveProductDiscount, type ProductDiscount } from '../../../services/publicCollectionsService';
import styles from './FeaturedProducts.module.css';

interface FeaturedProductsProps {
  title?: string;
  label?: string;
  tag?: string;
  limit?: number;
}

export function FeaturedProducts({
  title = 'Productos Destacados',
  label = '',
  tag = 'destacado',
  limit = 8,
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function buildDiscountByProductId(discounts: ActiveProductDiscount[]) {
    const discountByProductId = new Map<string, ProductDiscount>();

    discounts.forEach((discount) => {
      discount.applicableProducts?.forEach((product) => {
        if (!discountByProductId.has(product.id)) {
          discountByProductId.set(product.id, discount);
        }
      });
    });

    return discountByProductId;
  }

  useEffect(() => {
    Promise.all([
      fetchPublicProducts({ sort: 'newest', limit, isFeatured: true }),
      fetchPublicCategories(),
      publicCollectionsService.getActiveDiscounts(),
    ])
      .then(([{ data }, categories, discounts]) => {
        const discountByProductId = buildDiscountByProductId(discounts);
        setProducts(
          data.map((p) => ({
            ...mapApiProductToProduct(p, categories),
            appliedDiscount: discountByProductId.get(p.id) ?? null,
          }))
        );
      })
      .catch(() => setProducts([]));
  }, [limit]);

  useEffect(() => {
    const getCardsPerView = () => {
      const width = window.innerWidth;
      if (width <= 480) return 1;
      if (width <= 900) return 2;
      if (width <= 1200) return 3;
      return 4;
    };

    const handleResize = () => {
      setCardsPerView(getCardsPerView());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filtered = products;
  const canSlide = filtered.length > cardsPerView;
  const clonedSlides = canSlide
    ? [
        ...filtered.slice(-cardsPerView),
        ...filtered,
        ...filtered.slice(0, cardsPerView),
      ]
    : filtered;
  const normalizedStart = canSlide ? cardsPerView : 0;

  useEffect(() => {
    setTransitionEnabled(false);
    setCurrentIndex(normalizedStart);

    const frame = window.requestAnimationFrame(() => {
      setTransitionEnabled(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [normalizedStart, filtered.length]);

  useEffect(() => {
    if (!canSlide) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 3500);

    return () => window.clearInterval(interval);
  }, [canSlide]);

  const handleTrackTransitionEnd = () => {
    if (!canSlide) return;

    if (currentIndex >= filtered.length + cardsPerView) {
      setTransitionEnabled(false);
      setCurrentIndex(cardsPerView);
      window.requestAnimationFrame(() => setTransitionEnabled(true));
    }
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
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex((prev) => prev - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const isLoading = products.length === 0;

  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.label}>{label}</span>
          <h2 className={styles.title}>{title}</h2>
        </div>
      </div>

      <div className={styles.carouselViewport}>
        <div
          className={styles.carouselTrack}
          style={{
            transform: `translateX(-${(currentIndex * 100) / Math.max(cardsPerView, 1)}%)`,
            transition: transitionEnabled ? 'transform 520ms ease' : 'none',
          }}
          onTransitionEnd={handleTrackTransitionEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 🟢 SOLUCIÓN CLS: Si está cargando, renderizamos tarjetas con altura reservada para mantener el layout estable */}
          {isLoading ? (
            Array.from({ length: cardsPerView }).map((_, idx) => (
              <div
                key={`featured-skeleton-${idx}`}
                className={styles.carouselSlide}
                style={{ width: `${100 / Math.max(cardsPerView, 1)}%` }}
              >
                <div 
                  style={{ 
                    height: '420px', 
                    background: '#f2efeb', 
                    borderRadius: '20px', 
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '18px',
                    gap: '12px',
                    animation: 'featured-shimmer-effect 1.5s infinite ease-in-out'
                  }}
                >
                  <div style={{ width: '100%', height: '240px', background: '#e6e2dd', borderRadius: '12px' }}></div>
                  <div style={{ width: '60%', height: '16px', background: '#e6e2dd', borderRadius: '4px' }}></div>
                  <div style={{ width: '40%', height: '24px', background: '#e6e2dd', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))
          ) : (
            clonedSlides.map((product, index) => (
              <div
                key={`${product.id}-${index}`}
                className={styles.carouselSlide}
                style={{ width: `${100 / Math.max(cardsPerView, 1)}%` }}
              >
                <ProductCard product={product} variant="featured" />
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.ctaContainer}>
        <Link to={`/productos?tag=${tag}`}>
          <Button className={styles.ctaButton} variant="primary" size="lg">
            Ver todos
          </Button>
        </Link>
      </div>

      <style>{`
        @keyframes featured-shimmer-effect {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </section>
  );
}