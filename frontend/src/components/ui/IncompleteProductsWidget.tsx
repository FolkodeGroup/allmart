import { useAdminProducts } from '../../context/useAdminProductsContext';
import styles from './IncompleteProductsWidget.module.css';
import { Link } from 'react-router-dom';
import { Button } from './Button/Button';

interface IncompleteProduct {
  id: string;
  name: string;
  sku: string;
  missingFields: string[];
}

export default function IncompleteProductsWidget() {
  const { products } = useAdminProducts();

  // Determinar productos incompletos (falta descripción, imagen, categoría, etc)
  const incompleteProducts: IncompleteProduct[] = products
    .filter(p => {
      const missing = [];
      if (!p.description || p.description.trim().length === 0) missing.push('Descripción');
      if (!p.images || p.images.length === 0) missing.push('Imagen');
      if (!p.category) missing.push('Categoría');
      return missing.length > 0;
    })
    .map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      missingFields: [
        !p.description || p.description.trim().length === 0 ? 'Descripción' : '',
        !p.images || p.images.length === 0 ? 'Imagen' : '',
        !p.category ? 'Categoría' : '',
      ].filter(Boolean),
    }))
    .slice(0, 5);

  const count = products.filter(p => {
    const missing = [];
    if (!p.description || p.description.trim().length === 0) missing.push('Descripción');
    if (!p.images || p.images.length === 0) missing.push('Imagen');
    if (!p.category) missing.push('Categoría');
    return missing.length > 0;
  }).length;

  if (incompleteProducts.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.icon}>📝</span> Productos Incompletos
          </h2>
          <span className={styles.badge}>0</span>
        </div>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>¡Excelente! Todos los productos están completos.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>⚠️</span> Productos Incompletos
        </h2>
        <span className={`${styles.badge} ${styles.badgeAlert}`}>{count}</span>
      </div>

      <div className={styles.productsList}>
        {incompleteProducts.map((product, idx) => (
          <div key={product.id} className={styles.productItem}>
            <div className={styles.productHeader}>
              <div className={styles.productInfo}>
                <span className={styles.productName}>{product.name}</span>
                {product.sku && <span className={styles.sku}>{product.sku}</span>}
              </div>
            </div>

            <div className={styles.missingFields}>
              <span className={styles.label}>Falta:</span>
              <div className={styles.tags}>
                {product.missingFields.map(field => (
                  <span key={field} className={styles.tag}>
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <Link to={`/admin/productos/${product.id}`}>
                <Button variant="primary" size="sm">Completar</Button>
              </Link>
            </div>

            {idx < incompleteProducts.length - 1 && <div className={styles.divider} />}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Link to="/admin/productos?status=incomplete">
          <Button variant="secondary" size="sm">Ver todos los productos →</Button>
        </Link>
      </div>
    </section>
  );
}
