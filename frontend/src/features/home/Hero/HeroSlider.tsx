import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import styles from './HeroSlider.module.css';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1687942918532-69295473701d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Decoraciones de Cocina',
  },
  {
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Decoraciones del Hogar',
  },
  {
    image: 'https://plus.unsplash.com/premium_photo-1661639413040-ad00da34a3e4?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Decoraciones de Baño',
  },
  {
    image: 'https://images.unsplash.com/photo-1619154666839-03c9710cbdd1?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Decoraciones del Jardín',
  },
    {
    image: 'https://images.unsplash.com/photo-1642764732956-260a242876b8?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Limpieza',
  },
];


export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = slides.length;
  const intervalRef = useRef<number | null>(null);

  const goTo = (idx: number) => setCurrent(idx);
  const prev = () => goTo(current === 0 ? total - 1 : current - 1);
  const next = () => goTo(current === total - 1 ? 0 : current + 1);

  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = window.setInterval(() => {
      setCurrent((c) => (c === total - 1 ? 0 : c + 1));
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, total]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div
      className={styles.slider}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.carouselTrack} style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide, idx) => (
          <div className={styles.carouselSlide} key={idx}>
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
        ))}
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
