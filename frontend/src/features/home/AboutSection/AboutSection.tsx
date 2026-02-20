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
          <span className={styles.label}>Sobre</span>
          <h2 className={styles.title + ' ' + styles['color-title']}>
            Allmart
          </h2>
          <p className={styles.description}>
            Allmart ofrece productos de alta calidad diseñados para acompañarte en la rutina diaria de tu hogar.
            <br />
            Cada artículo busca simplificar tus tareas cotidianas, brindándote utilidad, rapidez y practicidad.
            <br />
            Incluye productos para las diferentes áreas de la casa —como cocina, sala de estar y baño— y pronto incorporará también textiles y blanco.
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
