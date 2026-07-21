// frontend/src/features/home/CategoryGrid/CategoryGrid.tsx

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Category } from '../../../types';
import * as categoriesService from '../../../services/categoriesService';
import { getCachedPublicCategories } from '../../../services/categoriesService';
import { Button } from '../../../components/ui/Button/Button';
import styles from './CategoryGrid.module.css';
// 🟢 OPTIMIZACIÓN IMÁGENES: Importamos la función de redimensión del CDN de Cloudflare
import { getOptimizedImageUrl } from '../../../utils/imageUrl';

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
  const [categories, setCategories] = useState<Category[]>(
    () => getCachedPublicCategories() ?? []
  );
  const [isLoading, setIsLoading] = useState(
    () => getCachedPublicCategories() === null
  );

  useEffect(() => {
    categoriesService.fetchPublicCategories()
      .then(setCategories)
      .catch((err) => console.error('Error fetching categories:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const rootCategories = categories.filter((cat) => !cat.parentId);
  const featured = [...rootCategories]
    .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))
    .slice(0, 6);

  return (
    <section className={styles.section} aria-label="Categorías destacadas">
      <div className={styles.header}>
        <span className={styles.label}>Explora todas las</span>
        <h2 className={styles.title}>Categorías destacadas</h2>
        <p className={styles.subtitle}>
          Todo lo que necesitás para tu hogar, organizado para vos.
        </p>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`${styles.card} ${styles.cardSkeleton}`}>
              <div className={styles.cardOverlay}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {featured.map((cat) => {
            const { prefix, bold } = splitCategoryName(cat.name);
            
            // 🟢 OPTIMIZACIÓN IMÁGENES: Redimensionamos la imagen de categoría a 400px de ancho
            const optimizedUrl = getOptimizedImageUrl(cat.image, 400);

            return (
              <Link
                key={cat.id}
                to={`/productos?category=${cat.slug}`}
                className={styles.card}
                aria-label={`Ver categoría ${cat.name}`}
              >
                {cat.image ? (
                  <img
                    className={styles.cardImage}
                    src={optimizedUrl}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="400"
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>🗂️</div>
                )}
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
      )}

      <div className={styles.viewAll}>
        <Link to="/productos">
          <Button variant="secondary">Ver todas las categorías</Button>
        </Link>
      </div>
    </section>
  );
}