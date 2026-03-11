import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../../types';
import {
  fetchPublicProducts,
  mapApiProductToProduct,
} from '../../../services/productsService';
import { fetchPublicCategories } from '../../../services/categoriesService';
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
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([fetchPublicProducts({ sort: 'newest', limit }), fetchPublicCategories()])
      .then(([{ data }, categories]) => {
        setProducts(data.map((p) => mapApiProductToProduct(p, categories)));
      })
      .catch(() => setProducts([]));
  }, [limit]);

  // El tag se usa para filtrar visualmente; como el backend no soporta tags aún,
  // se muestran todos los productos cargados.
  const filtered = products;

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
