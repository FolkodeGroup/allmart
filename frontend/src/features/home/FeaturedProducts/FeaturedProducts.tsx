import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../../types';
import {
  fetchPublicProducts,
  mapApiProductToProduct,
} from '../../../services/productsService';
import { fetchPublicCategories } from '../../../services/categoriesService';
import { ProductCard } from '../../products/ProductCard/ProductCard';
import { Button } from '../../../components/ui/Button/Button';
import styles from './FeaturedProducts.module.css';

interface FeaturedProductsProps {
  title?: string;
  label?: string;
  tag?: string;
  limit?: number;
}

export function FeaturedProducts({
  title = 'Productos destacados',
  label = 'Lo mejor',
  tag = 'destacado',
  limit = 8,
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  useEffect(() => {
    Promise.all([fetchPublicProducts({ sort: 'newest', limit }), fetchPublicCategories()])
      .then(([{ data }, categories]) => {
        setProducts(data.map((p) => mapApiProductToProduct(p, categories)));
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

  // El tag se usa para filtrar visualmente; como el backend no soporta tags aún,
  // se muestran todos los productos cargados.
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

  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.label}>{label}</span>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <Link to={`/productos?tag=${tag}`}>
          <Button className={styles.butSecundaryAdaptado} variant="secondary" size="sm">
            Ver todos
          </Button>
        </Link>
      </div>

      <div className={styles.carouselViewport}>
        <div
          className={styles.carouselTrack}
          style={{
            transform: `translateX(-${(currentIndex * 100) / Math.max(cardsPerView, 1)}%)`,
            transition: transitionEnabled ? 'transform 520ms ease' : 'none',
          }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {clonedSlides.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className={styles.carouselSlide}
              style={{ width: `${100 / Math.max(cardsPerView, 1)}%` }}
            >
              <ProductCard product={product} variant="featured" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
