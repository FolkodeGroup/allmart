import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { TrendingUp, PackageOpen, Percent, DollarSign } from 'lucide-react';
import styles from './ProductDetailPricing.module.css';

interface ProductDetailPricingProps {
  product: AdminProduct;
}

export function ProductDetailPricing({ product }: ProductDetailPricingProps) {
  const discountedPrice = product.discount
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const savings = product.discount
    ? product.price - discountedPrice
    : 0;

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

        {product.originalPrice && product.originalPrice > 0 && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <TrendingUp size={16} />
              <span>Precio original</span>
            </div>
            <div className={styles.cardValue}>
              ${product.originalPrice.toFixed(2)}
            </div>
            <div className={styles.cardMeta}>
              Antes de descuento
            </div>
          </div>
        )}

        {product.discount && product.discount > 0 && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Percent size={16} />
              <span>Descuento</span>
            </div>
            <div className={styles.cardValue}>
              {product.discount}%
            </div>
            <div className={styles.cardMeta}>
              Ahorrar ${savings.toFixed(2)}
            </div>
          </div>
        )}

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

          {product.originalPrice && product.originalPrice > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Precio original</span>
              <span className={styles.detailValue}>${product.originalPrice.toFixed(2)}</span>
            </div>
          )}

          {product.discount && product.discount > 0 && (
            <>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Descuento</span>
                <span className={styles.detailValue}>{product.discount}%</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Precio con descuento</span>
                <span className={styles.detailValue} style={{ color: '#059669' }}>
                  ${discountedPrice.toFixed(2)}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Ahorro total</span>
                <span className={styles.detailValue} style={{ color: '#dc2626' }}>
                  ${savings.toFixed(2)}
                </span>
              </div>
            </>
          )}
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
