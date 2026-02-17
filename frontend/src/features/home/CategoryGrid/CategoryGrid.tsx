import { Link } from 'react-router-dom';
import { categories } from '../../../data/mock';
import { Button } from '../../../components/ui/Button/Button';
import styles from './CategoryGrid.module.css';

export function CategoryGrid() {
  const featured = categories.slice(0, 6);

  return (
    <section className={styles.section} aria-label="Categorías destacadas">
      <div className={styles.header}>
        <span className={styles.label}>Explora</span>
        <h2 className={styles.title}>Categorías destacadas</h2>
        <p className={styles.subtitle}>
          Todo lo que necesitás para tu hogar, organizado para vos.
        </p>
      </div>

      <div className={styles.grid}>
        {featured.map((cat) => (
          <Link
            key={cat.id}
            to={`/productos?category=${cat.slug}`}
            className={styles.card}
            aria-label={`Ver categoría ${cat.name}`}
          >
            <img
              className={styles.cardImage}
              src={cat.image}
              alt={cat.name}
              loading="lazy"
              decoding="async"
            />
            <div className={styles.cardOverlay}>
              <h3 className={styles.cardName}>{cat.name}</h3>
              {/* <span className={styles.cardCount}>
                {cat.itemCount} productos
              </span> */}
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.viewAll}>
        <Link to="/productos">
          <Button variant="secondary">Ver todas las categorías</Button>
        </Link>
      </div>
    </section>
  );
}
