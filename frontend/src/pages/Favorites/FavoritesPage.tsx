import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../../features/products/ProductCard/ProductCard';
import { Button } from '../../components/ui/Button/Button';
import { useFavorites } from '../../components/layout/context/FavoritesContextUtils';
import styles from './FavoritesPage.module.css';

export function FavoritesPage() {
  const { items, totalItems, clearFavorites } = useFavorites();

  if (totalItems === 0) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState} aria-label="Favoritos vacíos">
          <div className={styles.emptyIconWrap}>
            <Heart size={28} aria-hidden="true" />
          </div>
          <h1 className={styles.emptyTitle}>Todavía no guardaste favoritos</h1>
          <p className={styles.emptyText}>
            Marcá productos con el corazón para volver a encontrarlos rápido cuando regreses.
          </p>
          <Link to="/productos" className={styles.emptyLink}>
            Explorar productos
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="Tus favoritos">
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>Tu selección</span>
          <h1 className={styles.title}>Mis favoritos</h1>
          <p className={styles.subtitle}>
            Tenés {totalItems} {totalItems === 1 ? 'producto guardado' : 'productos guardados'} para revisarlos cuando quieras.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={clearFavorites}>
          Vaciar favoritos
        </Button>
      </section>

      <section className={styles.grid} aria-label="Lista de favoritos">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  );
}