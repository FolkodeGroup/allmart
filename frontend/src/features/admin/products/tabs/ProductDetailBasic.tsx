import { useState } from 'react';
import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { AlertCircle, Check, ChevronDown, ChevronUp, Tag as TagIcon, ListChecks, FileText, Info } from 'lucide-react';
import styles from './ProductDetailBasic.module.css';

interface ProductDetailBasicProps {
  product: AdminProduct;
}

const DESC_TRUNCATE_LIMIT = 150;

export function ProductDetailBasic({ product }: ProductDetailBasicProps) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const fullDescription = product.description || '';
  const shouldTruncate = fullDescription.length > DESC_TRUNCATE_LIMIT;
  const displayedDescription = isDescExpanded || !shouldTruncate
    ? fullDescription
    : `${fullDescription.slice(0, DESC_TRUNCATE_LIMIT)}...`;

  return (
    <div className={`${styles.container} basicContainerResponsive`}>
      <style>{`
        @media (max-width: 767px) {
          .basicContainerResponsive {
            padding: 4px 0 !important;
          }
          .basicInfoGrid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>

      {/* 1. Información General */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Info size={14} /> Información general
        </h3>
        <div className={`${styles.infoGrid} basicInfoGrid`}>
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

      {/* 2. Descripción */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <FileText size={14} /> Descripción
        </h3>
        {product.shortDescription && (
          <div className={styles.field}>
            <span className={styles.label}>Descripción Corta</span>
            <p className={styles.valueText}>{product.shortDescription}</p>
          </div>
        )}
        {fullDescription ? (
          <div className={styles.field}>
            <span className={styles.label}>Descripción Completa</span>
            <p className={styles.valueText}>{displayedDescription}</p>
            {shouldTruncate && (
              <button
                type="button"
                className={styles.expandBtn}
                onClick={() => setIsDescExpanded(!isDescExpanded)}
              >
                {isDescExpanded ? (
                  <>Ver menos <ChevronUp size={14} /></>
                ) : (
                  <>Ver más <ChevronDown size={14} /></>
                )}
              </button>
            )}
          </div>
        ) : (
          !product.shortDescription && <p className={styles.empty}>Sin descripción</p>
        )}
      </section>

      {/* 3. Características */}
      {product.features && product.features.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <ListChecks size={14} /> Características
          </h3>
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

      {/* 4. Etiquetas y Estado */}
      <div className={styles.bottomRow}>
        {product.tags && product.tags.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <TagIcon size={14} /> Etiquetas
            </h3>
            <div className={styles.tagsList}>
              {product.tags.map((tag, i) => (
                <span key={i} className={styles.tag}>#{tag}</span>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Estado de publicación</h3>
          <div className={styles.statusRow}>
            <div className={styles.statusItem}>
              <span className={styles.label}>Disponibilidad</span>
              <div className={`${styles.statusBadge} ${product.inStock ? styles.active : styles.inactive}`}>
                {product.inStock ? <><Check size={13} /><span>En Stock</span></> : <><AlertCircle size={13} /><span>Agotado</span></>}
              </div>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Destacado</span>
              <div className={`${styles.statusBadge} ${product.isFeatured ? styles.active : styles.inactive}`}>
                {product.isFeatured ? <><Check size={13} /><span>Sí</span></> : <><AlertCircle size={13} /><span>No</span></>}
              </div>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.label}>Puntuación</span>
              <p className={styles.ratingValue}>
                {product.rating
                  ? `${product.rating.toFixed(1)} ⭐ (${product.reviewCount})`
                  : 'Sin opiniones'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}