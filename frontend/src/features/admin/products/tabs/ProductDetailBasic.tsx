import { useState } from 'react';
import type { AdminProduct } from '../../../../context/AdminProductsContext';
import { AlertCircle, Check, ChevronDown, ChevronUp, Tag as TagIcon, ListChecks, FileText, Info } from 'lucide-react';
import styles from './ProductDetailBasic.module.css';

interface ProductDetailBasicProps {
  product: AdminProduct;
}

const DESC_TRUNCATE_LIMIT = 180;

export function ProductDetailBasic({ product }: ProductDetailBasicProps) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const fullDescription = product.description || '';
  const shouldTruncate = fullDescription.length > DESC_TRUNCATE_LIMIT;
  const displayedDescription = isDescExpanded || !shouldTruncate
    ? fullDescription
    : `${fullDescription.slice(0, DESC_TRUNCATE_LIMIT)}...`;

  return (
    <div className="flatContainer">
      <style>{`
        .flatContainer {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          box-sizing: border-box;
          padding: 0 !important;
        }

        .flatGridTwoCols {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .flatGridTwoCols {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }

        .flatSectionBlock {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .flatSectionHeader {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #9ca3af);
          border-bottom: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          padding-bottom: 8px;
          margin-bottom: 4px;
        }

        .flatKeyValueGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .flatFieldGroup {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .flatLabel {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--color-text-secondary, #9ca3af);
        }

        .flatValue {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-primary, #ffffff);
          word-break: break-word;
        }

        .flatValueMono {
          font-family: monospace;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }

        .flatValueText {
          font-size: 14px;
          line-height: 1.5;
          color: var(--color-text-primary, #ffffff);
          white-space: pre-line;
          word-break: break-word;
        }

        .flatExpandBtn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: var(--color-primary, #769282);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
          margin-top: 4px;
        }

        .flatFeaturesList {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .flatFeatureItem {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 14px;
          color: var(--color-text-primary, #ffffff);
        }

        .flatFeatureCheck {
          color: #10b981;
          font-weight: 700;
          flex-shrink: 0;
        }

        .flatTagsRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .flatTagChip {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(118, 146, 130, 0.15);
          color: var(--color-primary-light, #8fa99a);
          border: 1px solid rgba(118, 146, 130, 0.3);
        }

        .flatStatusRow {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .flatStatusBadge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
        }

        .flatStatusActive {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .flatStatusInactive {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      `}</style>

      <div className="flatGridTwoCols">
        {/* Columna Izquierda: Información General & Descripción */}
        <div className="flatSectionBlock">
          {/* Información General */}
          <div>
            <div className="flatSectionHeader">
              <Info size={14} /> Información General
            </div>
            <div className="flatKeyValueGrid">
              <div className="flatFieldGroup">
                <span className="flatLabel">Nombre</span>
                <span className="flatValue">{product.name}</span>
              </div>
              <div className="flatFieldGroup">
                <span className="flatLabel">SKU</span>
                <span className="flatValue flatValueMono">{product.sku || '—'}</span>
              </div>
              <div className="flatFieldGroup">
                <span className="flatLabel">Categoría</span>
                <span className="flatValue">{product.category?.name || '—'}</span>
              </div>
              <div className="flatFieldGroup">
                <span className="flatLabel">Slug</span>
                <span className="flatValue flatValueMono" style={{ opacity: 0.8 }}>
                  {product.slug || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <div className="flatSectionHeader">
              <FileText size={14} /> Descripción
            </div>
            {product.shortDescription && (
              <div className="flatFieldGroup" style={{ marginBottom: '12px' }}>
                <span className="flatLabel">Descripción Corta</span>
                <p className="flatValueText">{product.shortDescription}</p>
              </div>
            )}
            {fullDescription ? (
              <div className="flatFieldGroup">
                <span className="flatLabel">Descripción Completa</span>
                <p className="flatValueText">{displayedDescription}</p>
                {shouldTruncate && (
                  <button
                    type="button"
                    className="flatExpandBtn"
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
              !product.shortDescription && (
                <p className="flatValueText" style={{ opacity: 0.5 }}>Sin descripción cargada.</p>
              )
            )}
          </div>
        </div>

        {/* Columna Derecha: Características, Etiquetas y Estado */}
        <div className="flatSectionBlock">
          {/* Características */}
          <div>
            <div className="flatSectionHeader">
              <ListChecks size={14} /> Características
            </div>
            {product.features && product.features.length > 0 ? (
              <ul className="flatFeaturesList">
                {product.features.map((feature, i) => (
                  <li key={i} className="flatFeatureItem">
                    <span className="flatFeatureCheck">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flatValueText" style={{ opacity: 0.5 }}>Sin características registradas.</p>
            )}
          </div>

          {/* Etiquetas */}
          <div>
            <div className="flatSectionHeader">
              <TagIcon size={14} /> Etiquetas
            </div>
            {product.tags && product.tags.length > 0 ? (
              <div className="flatTagsRow">
                {product.tags.map((tag, i) => (
                  <span key={i} className="flatTagChip">#{tag}</span>
                ))}
              </div>
            ) : (
              <p className="flatValueText" style={{ opacity: 0.5 }}>Sin etiquetas.</p>
            )}
          </div>

          {/* Estado de Publicación */}
          <div>
            <div className="flatSectionHeader">
              <Info size={14} /> Estado de Publicación
            </div>
            <div className="flatKeyValueGrid">
              <div className="flatFieldGroup">
                <span className="flatLabel">Disponibilidad</span>
                <div className="flatStatusRow">
                  <span className={`flatStatusBadge ${product.inStock ? 'flatStatusActive' : 'flatStatusInactive'}`}>
                    {product.inStock ? <><Check size={12} /> En Stock</> : <><AlertCircle size={12} /> Agotado</>}
                  </span>
                </div>
              </div>

              <div className="flatFieldGroup">
                <span className="flatLabel">Destacado</span>
                <div className="flatStatusRow">
                  <span className={`flatStatusBadge ${product.isFeatured ? 'flatStatusActive' : 'flatStatusInactive'}`}>
                    {product.isFeatured ? '✓ Sí' : '○ No'}
                  </span>
                </div>
              </div>

              <div className="flatFieldGroup" style={{ gridColumn: 'span 2' }}>
                <span className="flatLabel">Puntuación</span>
                <span className="flatValue">
                  {product.rating
                    ? `${product.rating.toFixed(1)} ⭐ (${product.reviewCount} opiniones)`
                    : 'Sin opiniones aún'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}