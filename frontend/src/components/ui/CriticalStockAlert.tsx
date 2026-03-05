import styles from './CriticalStockAlert.module.css';

export interface CriticalStockProduct {
  id: string;
  name: string;
  stock: number;
}

interface Props {
  products: CriticalStockProduct[];
}

export default function CriticalStockAlert({ products }: Props) {
  // Ordenar por stock ascendente y tomar los 3 con menor stock
  const sorted = [...products].sort((a, b) => a.stock - b.stock).slice(0, 3);
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
                  backgroundColor: product.stock <= 5 ? '#e53935' : '#82ca9d',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
