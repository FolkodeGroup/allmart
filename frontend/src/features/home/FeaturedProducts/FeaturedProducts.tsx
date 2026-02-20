import { Link } from 'react-router-dom';
import { products } from '../../../data/mock';
import { ProductCard } from '../../products/ProductCard/ProductCard';
import { Button } from '../../../components/ui/Button/Button';
import styles from './FeaturedProducts.module.css';

interface FeaturedProductsProps {
  title?: string;
  label?: string;
  tag?: string;
  limit?: number;
}

export function FeaturedProducts({
  title = 'Productos destacados',
  label = 'Lo mejor',
  tag = 'destacado',
  limit = 8,
}: FeaturedProductsProps) {
  const filtered = tag
    ? products.filter((p) => p.tags.includes(tag)).slice(0, limit)
    : products.slice(0, limit);

  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.label}>{label}</span>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <Link to={`/productos?tag=${tag}`}>
          <Button className={styles.butSecundaryAdaptado} variant="secondary" size="sm">
            Ver todos
          </Button>
        </Link>
      </div>

      <div className={styles.grid}>
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
