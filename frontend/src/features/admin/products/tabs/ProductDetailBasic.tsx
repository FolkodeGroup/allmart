import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { AlertCircle, Check } from 'lucide-react';
import styles from './ProductDetailBasic.module.css';

interface ProductDetailBasicProps {
  product: AdminProduct;
}

export function ProductDetailBasic({ product }: ProductDetailBasicProps) {
  return (
    <div className={styles.container}>
      {/* Información general + Descripción en columnas */}
      <div className={styles.topRow}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Información general</h3>
          <div className={styles.infoGrid}>
            <div className={styles.field}>
              <span className={styles.label}>Nombre</span>
              <p className={styles.value}>{product.name}</p>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>SKU</span>
              <p className={`${styles.value} ${styles.mono}`}>{product.sku || '-'}</p>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Categoría</span>
              <p className={styles.value}>{product.category?.name || '-'}</p>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Slug</span>
              <p className={`${styles.value} ${styles.mono} ${styles.muted}`}>{product.slug || '-'}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Descripción</h3>
          {product.shortDescription && (
            <div className={styles.field}>
              <span className={styles.label}>Corta</span>
              <p className={styles.value}>{product.shortDescription}</p>
            </div>
          )}
          {product.description && (
            <div className={styles.field}>
              <span className={styles.label}>Completa</span>
              <p className={styles.valueText}>{product.description}</p>
            </div>
          )}
          {!product.shortDescription && !product.description && (
            <p className={styles.empty}>Sin descripción</p>
          )}
        </section>
      </div>

      {/* Fila inferior: características + etiquetas + estado */}
      <div className={styles.bottomRow}>
        {product.features && product.features.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Características</h3>
            <ul className={styles.featuresList}>
              {product.features.map((f, i) => (
                <li key={i} className={styles.featureItem}>
                  <span className={styles.featureDot} />
                  {f}
                </li>
              ))}
            </ul>
          </section>
        )}

        {product.tags && product.tags.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Etiquetas</h3>
            <div className={styles.tagsList}>
              {product.tags.map((tag, i) => (
                <span key={i} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Estado</h3>
          <div className={styles.statusRow}>
            <div className={styles.statusItem}>
              <span className={styles.label}>En stock</span>
              <div className={`${styles.statusBadge} ${product.inStock ? styles.active : styles.inactive}`}>
                {product.inStock ? <><Check size={13} /><span>Sí</span></> : <><AlertCircle size={13} /><span>No</span></>}
              </div>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Destacado</span>
              <div className={`${styles.statusBadge} ${product.isFeatured ? styles.active : styles.inactive}`}>
                {product.isFeatured ? <><Check size={13} /><span>Sí</span></> : <><AlertCircle size={13} /><span>No</span></>}
              </div>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Rating</span>
              <p className={styles.ratingValue}>
                {product.rating
                  ? `${product.rating.toFixed(1)} ⭐ (${product.reviewCount})`
                  : 'Sin rating'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

