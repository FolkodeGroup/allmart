import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import styles from './HeroSlider.module.css';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1687942918532-69295473701d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Decoraciones de Cocina',
    tagline: 'Cocina',
    title: 'Renová tu cocina con estilo',
    subtitle: 'Utensilios, vajilla y accesorios para que cocinar sea un placer.',
    primaryBtn: { label: 'Ver productos de cocina', link: '/productos?tag=cocina' },
    secondaryBtn: { label: 'Ofertas en cocina', link: '/productos?tag=cocina&oferta=true' },
    color: 'var(--color-primary)',
    styles: {
      title: { color: 'var(--color-neutral-light)', backgroundColor: 'var(--color-primary)', padding: '0.5rem 1rem', borderRadius: '4px' },
      subtitle: { color: 'var(--color-neutral-dark)', backgroundColor: 'var(--color-warm-gray-light)', padding: '0.5rem 1rem', borderRadius: '4px', marginLeft: '3rem' },
    },
  },
  {
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Decoraciones del Hogar',
    tagline: 'Hogar',
    title: 'Deco y confort para tu hogar',
    subtitle: 'Encontrá todo para ambientar y disfrutar cada rincón.',
    primaryBtn: { label: 'Ver decoración', link: '/productos?tag=hogar' },
    secondaryBtn: { label: 'Novedades para el hogar', link: '/productos?tag=hogar&novedad=true' },
    color: 'var(--color-accent)',
    styles: {
      title: { color: 'var(--color-neutral-light)', backgroundColor: 'var(--color-accent)', padding: '0.5rem 1rem', borderRadius: '4px' },
      subtitle: { color: 'var(--color-neutral-dark)', backgroundColor: 'var(--color-accent-dark)', padding: '0.5rem 1rem', borderRadius: '4px', marginLeft: '3rem' },
    },
  },
  {
    image: 'https://plus.unsplash.com/premium_photo-1661639413040-ad00da34a3e4?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Decoraciones de Baño',
    tagline: 'Baño',
    title: 'Detalles que transforman tu baño',
    subtitle: 'Organizadores, textiles y más para un baño soñado.',
    primaryBtn: { label: 'Ver productos de baño', link: '/productos?tag=baño' },
    secondaryBtn: { label: 'Ofertas en baño', link: '/productos?tag=baño&oferta=true' },
    color: 'var(--color-warm-gray)',
    styles: {
      title: { color: 'var(--color-neutral-light)', backgroundColor: 'var(--color-warm-gray)', padding: '0.5rem 1rem', borderRadius: '4px' },
      subtitle: { color: 'var(--color-neutral-dark)', backgroundColor: 'var(--color-neutral-light)', padding: '0.5rem 1rem', borderRadius: '4px', marginLeft: '3rem' },
    },
  },
  {
    image: 'https://images.unsplash.com/photo-1619154666839-03c9710cbdd1?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Decoraciones del Jardín',
    tagline: 'Jardín',
    title: 'Viví tu jardín todo el año',
    subtitle: 'Macetas, herramientas y deco para tu espacio verde.',
    primaryBtn: { label: 'Ver productos de jardín', link: '/productos?tag=jardin' },
    secondaryBtn: { label: 'Ver ofertas de jardín', link: '/productos?tag=jardin&oferta=true' },
    color: 'var(--color-accent-dark)',
    styles: {
      title: { color: 'var(--color-neutral-light)', backgroundColor: 'var(--color-accent-dark)', padding: '0.5rem 1rem', borderRadius: '4px' },
      subtitle: { color: 'var(--color-neutral-dark)', backgroundColor: 'var(--color-soft-gray)', padding: '0.5rem 1rem', borderRadius: '4px', marginLeft: '3rem' },
    },
  },
  {
    image: 'https://images.unsplash.com/photo-1642764732956-260a242876b8?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Limpieza',
    tagline: 'Limpieza',
    title: 'Limpieza fácil, hogar impecable',
    subtitle: 'Productos prácticos y eficientes para tu día a día.',
    primaryBtn: { label: 'Ver productos de limpieza', link: '/productos?tag=limpieza' },
    secondaryBtn: { label: 'Ofertas en limpieza', link: '/productos?tag=limpieza&oferta=true' },
    color: 'var(--color-primary-dark)',
    styles: {
      title: { color: 'var(--color-neutral-light)', backgroundColor: 'var(--color-primary-dark)', padding: '0.5rem 1rem', borderRadius: '4px' },
      subtitle: { color: 'var(--color-neutral-dark)', backgroundColor: 'var(--color-accent)', padding: '0.5rem 1rem', borderRadius: '4px', marginLeft: '3rem' },
    },
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
            {/* Overlay content personalizado */}
            <div className={styles.overlayContent}>
              <span className={styles.tagline} style={{ color: slide.color }}>{slide.tagline}</span>
              <h1 className={styles.title} style={slide.styles?.title}>{slide.title}</h1>
              <p className={styles.subtitle} style={slide.styles?.subtitle}>{slide.subtitle}</p>
              <div className={styles.cta}>
                <Link to={slide.primaryBtn.link}>
                  <Button variant="primary" size="lg" style={{ backgroundColor: slide.color, borderColor: slide.color, textDecoration: 'underline' }}>
                    {slide.primaryBtn.label}
                  </Button>
                </Link>
                <Link to={slide.secondaryBtn.link}>
                  <Button variant="secondary" size="lg" style={{ color: slide.color, borderColor: slide.color, backgroundColor: 'var(--color-neutral-light)', textDecoration: 'underline' }}>
                    {slide.secondaryBtn.label}
                  </Button>
                </Link>
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
