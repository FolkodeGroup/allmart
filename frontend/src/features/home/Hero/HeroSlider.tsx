import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import styles from './HeroSlider.module.css';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    alt: 'Productos de cocina y hogar de alta calidad',
  },
  {
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
    alt: 'Decoración moderna para el hogar',
  },
  {
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80',
    alt: 'Ambiente acogedor en el living',
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  const goTo = (idx: number) => setCurrent(idx);
  const prev = () => setCurrent((c) => (c === 0 ? total - 1 : c - 1));
  const next = () => setCurrent((c) => (c === total - 1 ? 0 : c + 1));

  const slide = slides[current];

  return (
    <div className={styles.slider}>
      <div className={styles.imageWrapper}>
        <img
          className={styles.heroImage}
          src={slide.image}
          alt={slide.alt}
          loading="eager"
          fetchPriority="high"
        />
        {/* Overlay content */}
        <div className={styles.overlayContent}>
          <span className={styles.tagline}>Bienvenido a Allmart</span>
          <h1 className={styles.title}>
            Una forma práctica de{' '}
            <span className={styles.titleAccent}>disfrutar tu hogar.</span>
          </h1>
          <p className={styles.subtitle}>
            Descubrí nuestra selección curada de productos para cocina,
            decoración, hogar y más. Calidad, diseño y precios accesibles en
            un solo lugar.
          </p>
          <div className={styles.cta}>
            <Link to="/productos">
              <Button variant="primary" size="lg">
                Explorar catálogo
              </Button>
            </Link>
            <Link to="/productos?tag=oferta">
              <Button variant="secondary" size="lg">
                Ver ofertas
              </Button>
            </Link>
          </div>
          <div className={styles.floatingCard}>
            <div className={styles.floatingIcon} aria-hidden="true">✦</div>
            <div className={styles.floatingText}>
              <span className={styles.floatingLabel}>Envíos</span>
              <span className={styles.floatingValue}>Gratis en CABA y GBA</span>
            </div>
          </div>
        </div>
      </div>
      <button className={styles.arrow + ' ' + styles.left} onClick={prev} aria-label="Anterior">&#8592;</button>
      <button className={styles.arrow + ' ' + styles.right} onClick={next} aria-label="Siguiente">&#8594;</button>
      <div className={styles.dots}>
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={styles.dot + (idx === current ? ' ' + styles.active : '')}
            onClick={() => goTo(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
            aria-current={idx === current ? 'true' : undefined}
          />
        ))}
      </div>
    </div>
  );
}
