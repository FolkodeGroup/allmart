import { Link } from 'react-router-dom';
import { categories } from '../../../data/mock';
import { Button } from '../../../components/ui/Button/Button';
import styles from './CategoryGrid.module.css';

/**
 * Divide el nombre de la categoría en dos partes:
 * - prefix: primera(s) palabra(s) en peso regular
 * - bold: última(s) palabra(s) en negrita
 *
 * Regla: si el nombre contiene "para" o "y", se parte tras esa palabra.
 * Si empieza con "Especial", se parte tras "Especial".
 * En otro caso todo va en bold.
 */
function splitCategoryName(name: string): { prefix: string; bold: string } {
  const lowerName = name.toLowerCase();

  const splitWords = ['para', 'y'];
  for (const word of splitWords) {
    const idx = lowerName.indexOf(` ${word} `);
    if (idx !== -1) {
      const splitIdx = idx + word.length + 1;
      return {
        prefix: name.slice(0, splitIdx + 1).trim(),
        bold: name.slice(splitIdx + 1).trim(),
      };
    }
  }

  if (name.toLowerCase().startsWith('especial')) {
    const rest = name.slice('especial'.length).trim();
    return { prefix: 'Especial', bold: rest };
  }

  return { prefix: '', bold: name };
}

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
        {featured.map((cat) => {
          const { prefix, bold } = splitCategoryName(cat.name);
          return (
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
                <h3 className={styles.cardName}>
                  {prefix && (
                    <span className={styles.cardNamePrefix}>{prefix}</span>
                  )}
                  <strong className={styles.cardNameBold}>{bold}</strong>
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      <div className={styles.viewAll}>
        <Link to="/productos">
          <Button variant="secondary">Ver todas las categorías</Button>
        </Link>
      </div>
    </section>
  );
}
