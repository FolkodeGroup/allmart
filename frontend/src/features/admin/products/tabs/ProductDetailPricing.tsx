import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { PackageOpen, DollarSign } from 'lucide-react';
import styles from './ProductDetailPricing.module.css';

interface ProductDetailPricingProps {
  product: AdminProduct;
}

export function ProductDetailPricing({ product }: ProductDetailPricingProps) {
  return (
    <div className={styles.container}>
      {/* Pricing Overview Cards */}
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <DollarSign size={16} />
            <span>Precio actual</span>
          </div>
          <div className={styles.cardValue}>
            ${product.price.toFixed(2)}
          </div>
          <div className={styles.cardMeta}>
            Precio de venta
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <PackageOpen size={16} />
            <span>Stock</span>
          </div>
          <div className={`${styles.cardValue} ${product.stock <= 0 ? styles.critical : ''}`}>
            {product.stock} unidades
          </div>
          <div className={styles.cardMeta}>
            {product.inStock ? 'En stock' : 'Agotado'}
          </div>
        </div>
      </div>

      {/* Pricing Details */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Detalles de precio</h3>
        <div className={styles.detailGrid}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Precio base</span>
            <span className={styles.detailValue}>${product.price.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Inventory Details */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Inventario</h3>

        <div className={styles.detailGrid}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Stock total</span>
            <span className={styles.detailValue}>{product.stock}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Estado</span>
            <span className={`${styles.detailValue} ${product.inStock ? styles.inStock : styles.outOfStock}`}>
              {product.inStock ? 'En stock' : 'Agotado'}
            </span>
          </div>
        </div>

        {product.stock <= 10 && product.stock > 0 && (
          <div className={styles.warning}>
            ⚠️ Stock bajo: Solo quedan {product.stock} unidades
          </div>
        )}

        {product.stock === 0 && (
          <div className={styles.critical}>
            ⚠️ Producto agotado: No hay stock disponible
          </div>
        )}
      </section>

    </div>
  );
}
