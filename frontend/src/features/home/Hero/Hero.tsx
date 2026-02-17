import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-label="Presentación principal">
      <div className={styles.circle1} aria-hidden="true" />
      <div className={styles.circle2} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.content}>
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
        </div>

        <div className={styles.imageWrapper}>
          <img
            className={styles.heroImage}
            src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"
            alt="Productos de cocina y hogar de alta calidad"
            loading="eager"
            fetchPriority="high"
          />
          <div className={styles.floatingCard}>
            <div className={styles.floatingIcon} aria-hidden="true">✦</div>
            <div className={styles.floatingText}>
              <span className={styles.floatingLabel}>Envíos</span>
              <span className={styles.floatingValue}>Gratis en CABA y GBA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
