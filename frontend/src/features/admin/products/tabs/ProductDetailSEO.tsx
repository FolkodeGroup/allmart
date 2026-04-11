import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { Eye, Globe, Zap } from 'lucide-react';
import styles from './ProductDetailSEO.module.css';

interface ProductDetailSEOProps {
  product: AdminProduct;
}

export function ProductDetailSEO({ product }: ProductDetailSEOProps) {
  return (
    <div className={styles.container}>
      {/* Publishing Status */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Estado de publicación</h3>

        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Publicado</span>
            <div className={`${styles.statusBadge} ${product.inStock ? styles.active : styles.inactive}`}>
              {product.inStock ? '✓ Sí' : '✗ No'}
            </div>
          </div>

          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Destacado</span>
            <div className={`${styles.statusBadge} ${product.isFeatured ? styles.active : styles.inactive}`}>
              {product.isFeatured ? '✓ Sí' : '✗ No'}
            </div>
          </div>
        </div>
      </section>

      {/* SEO Information */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Información SEO</h3>

        <div className={styles.seoGrid}>
          <div className={styles.seoItem}>
            <div className={styles.seoHeader}>
              <Globe size={16} />
              <span>URL amigable</span>
            </div>
            <p className={styles.seoValue}>
              /{product.slug || product.name.toLowerCase().replace(/\s+/g, '-')}
            </p>
          </div>

          <div className={styles.seoItem}>
            <div className={styles.seoHeader}>
              <Eye size={16} />
              <span>Nombre del producto (visible)</span>
            </div>
            <p className={styles.seoValue}>{product.name}</p>
            <small className={styles.seoMeta}>
              Longitud: {product.name.length} caracteres (Recomendado: 30-60)
            </small>
          </div>

          <div className={styles.seoItem}>
            <div className={styles.seoHeader}>
              <Zap size={16} />
              <span>Descripción corta</span>
            </div>
            <p className={styles.seoValue}>
              {product.shortDescription || '(No especificada)'}
            </p>
            <small className={styles.seoMeta}>
              Longitud: {product.shortDescription?.length || 0} caracteres (Recomendado: 120-160)
            </small>
          </div>
        </div>
      </section>

      {/* Content Quality */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Calidad del contenido</h3>

        <div className={styles.qualityGrid}>
          <div className={styles.qualityItem}>
            <span className={styles.qualityLabel}>Nombre completo</span>
            <div className={`${styles.qualityBadge} ${product.name ? styles.ok : styles.warning}`}>
              {product.name ? '✓' : '⚠'}
            </div>
          </div>

          <div className={styles.qualityItem}>
            <span className={styles.qualityLabel}>Descripción</span>
            <div className={`${styles.qualityBadge} ${product.description ? styles.ok : styles.warning}`}>
              {product.description ? '✓' : '⚠'}
            </div>
          </div>

          <div className={styles.qualityItem}>
            <span className={styles.qualityLabel}>Categoría</span>
            <div className={`${styles.qualityBadge} ${product.category?.id ? styles.ok : styles.warning}`}>
              {product.category?.id ? '✓' : '⚠'}
            </div>
          </div>

          <div className={styles.qualityItem}>
            <span className={styles.qualityLabel}>Imagen principal</span>
            <div className={`${styles.qualityBadge} ${product.images?.[0] ? styles.ok : styles.warning}`}>
              {product.images?.[0] ? '✓' : '⚠'}
            </div>
          </div>

          <div className={styles.qualityItem}>
            <span className={styles.qualityLabel}>Precio</span>
            <div className={`${styles.qualityBadge} ${product.price > 0 ? styles.ok : styles.warning}`}>
              {product.price > 0 ? '✓' : '⚠'}
            </div>
          </div>

          <div className={styles.qualityItem}>
            <span className={styles.qualityLabel}>SKU</span>
            <div className={`${styles.qualityBadge} ${product.sku ? styles.ok : styles.warning}`}>
              {product.sku ? '✓' : '⚠'}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Información adicional</h3>

        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Etiquetas</span>
            <div className={styles.tagsContainer}>
              {product.tags && product.tags.length > 0
                ? product.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tag}>
                      {tag}
                    </span>
                  ))
                : <span className={styles.noTags}>Sin etiquetas</span>}
            </div>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Características</span>
            <div className={styles.featuresContainer}>
              {product.features && product.features.length > 0
                ? product.features.map((feature, idx) => (
                    <span key={idx} className={styles.feature}>
                      • {feature}
                    </span>
                  ))
                : <span className={styles.noFeatures}>Sin características</span>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
