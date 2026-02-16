import styles from './AboutSection.module.css';

export function AboutSection() {
  return (
    <section className={styles.section} aria-label="Sobre Allmart">
      <div className={styles.inner}>
        <img
          className={styles.image}
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"
          alt="Interior de hogar decorado con productos Allmart"
          loading="lazy"
          decoding="async"
        />
        <div className={styles.content}>
          <span className={styles.label}>Sobre nosotros</span>
          <h2 className={styles.title}>
            Más de 25 años llevando calidad a tu hogar
          </h2>
          <p className={styles.description}>
            En Allmart somos proveedores de la más amplia variedad de productos
            de bazar, regalería, decoración, accesorios de limpieza y más.
            Estamos preparados para abastecer comercios y hogares con stock
            permanente. Nuestro objetivo es que puedas resolver tus necesidades
            de manera fácil, con un solo proveedor.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>25+</span>
              <span className={styles.statLabel}>Años de experiencia</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>5000+</span>
              <span className={styles.statLabel}>Productos</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>100+</span>
              <span className={styles.statLabel}>Marcas</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
