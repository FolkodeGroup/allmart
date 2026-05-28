import styles from './CriticalStockAlert.module.css';
import { LOW_STOCK_THRESHOLD } from '../../constants/inventory';

export interface CriticalStockProduct {
  id: string;
  name: string;
  stock: number;
}

interface Props {
  products: CriticalStockProduct[];
}

export default function CriticalStockAlert({ products }: Props) {
  // Filtrar solo productos con stock bajo (mayor a 0 y menor o igual al umbral)
  // Ordenar por stock ascendente y tomar los 3 con menor stock
  const criticalProducts = products.filter(p => p.stock >= 0 && p.stock <= LOW_STOCK_THRESHOLD);
  const sorted = [...criticalProducts].sort((a, b) => a.stock - b.stock).slice(0, 3);

  // Debug: mostrar en consola qué está siendo filtrado
  if (import.meta.env.MODE === 'development') {
    console.log('[CriticalStockAlert DEBUG]', {
      totalProducts: products.length,
      criticalCount: criticalProducts.length,
      criticalProducts: criticalProducts.map(p => ({ name: p.name, stock: p.stock })),
      displaying: sorted.length,
      displayedProducts: sorted.map(p => ({ name: p.name, stock: p.stock })),
    });
  }

  // Si no hay productos con stock crítico, no mostrar nada
  if (sorted.length === 0) {
    return null;
  }

  return (
    <section className={styles.criticalStockSection}>
      <h2 className={styles.title}>
        <span className={styles.icon}>⚠️</span> Alerta de Stock Crítico
      </h2>
      <div className={styles.list}>
        {sorted.map(product => (
          <div key={product.id} className={styles.item}>
            <div className={styles.info}>
              <span className={styles.productName}>{product.name}</span>
              <span className={styles.stockCount}>{product.stock} en stock</span>
            </div>
            <div className={styles.progressBarWrapper}>
              <div
                className={styles.progressBar}
                style={{
                  width: `${Math.min(100, product.stock * 10)}%`,
                  backgroundColor: product.stock === 0 ? '#d32f2f' : '#ff6f00',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
