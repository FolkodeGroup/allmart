import { useState } from 'react';
import type { Category } from '../../../../types';
import { Tag as TagIcon, Image as ImageIcon } from 'lucide-react';

interface CategoryDetailBasicProps {
  category: Category;
}

export function CategoryDetailBasic({ category }: CategoryDetailBasicProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="catBasicContainer">
      <style>{`
        .catBasicContainer {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          box-sizing: border-box;
          padding: 0 !important;
        }

        .catBasicSection {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .catBasicSectionTitle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary, #9ca3af);
          border-bottom: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          padding-bottom: 8px;
          margin: 0;
        }

        .catBasicKeyValueGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        @media (max-width: 640px) {
          .catBasicKeyValueGrid {
            grid-template-columns: 1fr;
          }
        }

        .catBasicFieldGroup {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .catBasicLabel {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-secondary, #9ca3af);
        }

        .catBasicValue {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary, #ffffff);
          word-break: break-word;
        }

        .catBasicValueMono {
          font-family: monospace;
          background: rgba(255, 255, 255, 0.05);
          padding: 3px 7px;
          border-radius: 4px;
          width: fit-content;
          font-size: 12px;
        }

        .catBasicDescText {
          font-size: 13px;
          line-height: 1.5;
          color: var(--color-text-primary, #ffffff);
          white-space: pre-line;
          word-break: break-word;
        }

        .catBasicEmptyDesc {
          font-size: 13px;
          color: #9ca3af;
          font-style: italic;
          opacity: 0.75;
        }

        .catBasicImagePreview {
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--color-border, rgba(229, 226, 221, 0.15));
          background: var(--color-bg-secondary, #1f2937);
          max-width: 100%;
        }

        .catBasicPreviewImg {
          width: 100%;
          height: auto;
          max-height: 300px;
          object-fit: cover;
          display: block;
        }

        .catBasicStatusBadge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          max-width: fit-content;
        }

        .catBasicStatusVisible {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .catBasicStatusHidden {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      `}</style>

      {/* Información General */}
      <div className="catBasicSection">
        <h3 className="catBasicSectionTitle">
          <TagIcon size={13} /> Información General
        </h3>
        <div className="catBasicKeyValueGrid">
          <div className="catBasicFieldGroup">
            <span className="catBasicLabel">Nombre</span>
            <span className="catBasicValue">{category.name}</span>
          </div>
          <div className="catBasicFieldGroup">
            <span className="catBasicLabel">Slug</span>
            <span className="catBasicValue catBasicValueMono">{category.slug}</span>
          </div>
          <div className="catBasicFieldGroup">
            <span className="catBasicLabel">Estado</span>
            <span className={`catBasicStatusBadge ${category.isVisible ? 'catBasicStatusVisible' : 'catBasicStatusHidden'}`}>
              {category.isVisible ? '✓ Visible' : '✕ Oculta'}
            </span>
          </div>
          <div className="catBasicFieldGroup">
            <span className="catBasicLabel">ID</span>
            <span className="catBasicValue catBasicValueMono" title={category.id}>
              {category.id.slice(0, 12)}…
            </span>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div className="catBasicSection">
        <h3 className="catBasicSectionTitle">
          <TagIcon size={13} /> Descripción
        </h3>
        {category.description ? (
          <p className="catBasicDescText">{category.description}</p>
        ) : (
          <p className="catBasicEmptyDesc">Sin descripción cargada</p>
        )}
      </div>

      {/* Imagen */}
      {category.image && !imgError && (
        <div className="catBasicSection">
          <h3 className="catBasicSectionTitle">
            <ImageIcon size={13} /> Imagen de Categoría
          </h3>
          <div className="catBasicImagePreview">
            <img
              src={category.image}
              alt={category.name}
              className="catBasicPreviewImg"
              onError={() => setImgError(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
