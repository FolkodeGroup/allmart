
// ...existing code...
import styles from './ProductInventoryList.module.css';

export type StockState = 'inStock' | 'lowStock' | 'outOfStock';

export interface ProductInventoryItem {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  stockState: StockState;
}

const exampleData: ProductInventoryItem[] = [
  {
    id: '1',
    name: 'Café Molido Premium',
    sku: 'CAF-001',
    imageUrl: 'https://via.placeholder.com/64',
    stockState: 'inStock',
  },
  {
    id: '2',
    name: 'Té Verde Orgánico',
    sku: 'TEA-042',
    imageUrl: 'https://via.placeholder.com/64',
    stockState: 'lowStock',
  },
  {
    id: '3',
    name: 'Aceite de Oliva Extra Virgen',
    sku: 'OIL-987',
    imageUrl: 'https://via.placeholder.com/64',
    stockState: 'outOfStock',
  },
];

interface ProductInventoryListProps {
  products?: ProductInventoryItem[];
}

export function ProductInventoryList({ products = exampleData }: ProductInventoryListProps) {
  const renderBadge = (state: StockState) => {
    let label = '';
    let className = '';

    switch (state) {
      case 'inStock':
        label = 'En Stock';
        className = styles.inStock;
        break;
      case 'lowStock':
        label = 'Poco Stock';
        className = styles.lowStock;
        break;
      case 'outOfStock':
        label = 'Sin Stock';
        className = styles.outOfStock;
        break;
    }

    return (
      <span className={`${styles.badge} ${className}`}>{label}</span>
    );
  };

  return (
    <div className={styles.container}>
      {products.map((p) => (
        <div key={p.id} className={styles.card}>
          <img src={p.imageUrl} alt={p.name} className={styles.image} />
          <div className={styles.info}>
            <span className={styles.title}>{p.name}</span>
            <span className={styles.sku}>{p.sku}</span>
          </div>
          {renderBadge(p.stockState)}
        </div>
      ))}
    </div>
  );
}
