import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { AlertCircle, Check } from 'lucide-react';
import styles from './ProductDetailBasic.module.css';

interface ProductDetailBasicProps {
  product: AdminProduct;
}

export function ProductDetailBasic({ product }: ProductDetailBasicProps) {
  return (
    <div className={styles.container}>
      {/* Product Header */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Información general</h3>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre</label>
            <p className={styles.value}>{product.name}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>SKU</label>
            <p className={styles.value}>{product.sku || '-'}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Categoría</label>
            <p className={styles.value}>{product.category?.name || '-'}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Slug</label>
            <p className={styles.value}>{product.slug || '-'}</p>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Descripción</h3>
        <div className={styles.field}>
          <label className={styles.label}>Descripción corta</label>
          <p className={styles.value}>
            {product.shortDescription || <em>No especificada</em>}
          </p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Descripción completa</label>
          <p className={styles.valueText}>
            {product.description || <em>No especificada</em>}
          </p>
        </div>
      </section>

      {/* Features */}
      {product.features && product.features.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Características</h3>
          <div className={styles.featuresList}>
            {product.features.map((feature, idx) => (
              <div key={idx} className={styles.featureItem}>
                <span className={styles.featureBadge}>•</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Etiquetas</h3>
          <div className={styles.tagsList}>
            {product.tags.map((tag, idx) => (
              <span key={idx} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Status */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Estado</h3>

        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>En stock</span>
            <div className={`${styles.statusBadge} ${product.inStock ? styles.active : styles.inactive}`}>
              {product.inStock ? (
                <>
                  <Check size={14} />
                  <span>Sí</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  <span>No</span>
                </>
              )}
            </div>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Destacado</span>
            <div className={`${styles.statusBadge} ${product.isFeatured ? styles.active : styles.inactive}`}>
              {product.isFeatured ? (
                <>
                  <Check size={14} />
                  <span>Sí</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  <span>No</span>
                </>
              )}
            </div>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Rating</span>
            <p className={styles.value}>
              {product.rating ? `${product.rating.toFixed(1)} ⭐ (${product.reviewCount} reseñas)` : 'Sin rating'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
