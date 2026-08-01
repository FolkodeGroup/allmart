import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { PackageOpen, DollarSign } from 'lucide-react';
import styles from './ProductDetailPricing.module.css';

interface ProductDetailPricingProps {
  product: AdminProduct;
}

export function ProductDetailPricing({ product }: ProductDetailPricingProps) {
  const threshold = (product as unknown as { criticalStockThreshold?: number }).criticalStockThreshold ?? 5;

  return (
    <div className={`${styles.container} pricingContainerResponsive`}>
      <style>{`
        @media (max-width: 767px) {
          .pricingContainerResponsive {
            padding: 4px 0 !important;
          }
          .pricingGridResponsive {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .pricingCardResponsive {
            padding: 12px !important;
            border-radius: 12px !important;
          }
          .pricingValueResponsive {
            font-size: 18px !important;
          }
        }
      `}</style>

      {/* Tarjetas resumen unificadas (Precio y Stock) */}
      <div className={`${styles.cardsGrid} pricingGridResponsive`}>
        <div className={`${styles.card} pricingCardResponsive`}>
          <div className={styles.cardHeader}>
            <DollarSign size={16} />
            <span>Precio actual</span>
          </div>
          <div className={`${styles.cardValue} pricingValueResponsive`}>
            ${product.price.toFixed(2)}
          </div>
          <div className={styles.cardMeta}>
            Precio de venta
          </div>
        </div>

        <div className={`${styles.card} pricingCardResponsive`}>
          <div className={styles.cardHeader}>
            <PackageOpen size={16} />
            <span>Stock</span>
          </div>
          <div className={`${styles.cardValue} pricingValueResponsive ${product.stock <= 0 ? styles.critical : ''}`}>
            {product.stock} un.
          </div>
          <div className={styles.cardMeta}>
            {product.inStock ? 'En stock' : 'Agotado'}
          </div>
        </div>
      </div>

      {/* Detalles de Inventario */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Inventario y Umbrales</h3>

        <div className={styles.detailGrid}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Stock total</span>
            <span className={styles.detailValue}>{product.stock} unidades</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Umbral de stock crítico</span>
            <span className={styles.detailValue}>{threshold} unidades</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Estado de publicación</span>
            <span className={`${styles.detailValue} ${product.inStock ? styles.inStock : styles.outOfStock}`}>
              {product.inStock ? 'En stock' : 'Agotado'}
            </span>
          </div>
        </div>

        {product.stock <= threshold && product.stock > 0 && (
          <div className={styles.warning}>
            ⚠️ Stock bajo: Solo quedan {product.stock} unidades (Umbral crítico: {threshold})
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