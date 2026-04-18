import { ReadyToPublishChecklist } from './ReadyToPublishChecklist';
import styles from './ProductWizard.module.css';
import type { StepProps } from './types';

export function Step3ReviewPublish({ data, categories }: Omit<StepProps, 'onDataChange' | 'errors'>) {

  const categoryName = categories.find((c) => c.id === data.categoryId)?.name || 'N/A';

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Revisar y Publicar</h2>
      <p className={styles.stepDescription}>Verifica que todo esté correcto antes de publicar</p>

      {/* Checklist */}
      <ReadyToPublishChecklist data={data} showDetails={true} />

      {/* Product Preview */}
      <div className={styles.previewSection}>
        <h3 className={styles.sectionTitle}>Vista Previa</h3>

        <div className={styles.previewCard}>
          {/* Images Preview */}
          {data.images && data.images.length > 0 && (
            <div className={styles.previewImageArea}>
              <div className={styles.mainImage}>
                <img
                  src={data.images[0]}
                  alt={data.name}
                  className={styles.previewImg}
                />
              </div>
              {data.images.length > 1 && (
                <div className={styles.thumbImages}>
                  {data.images.slice(1, 4).map((img, idx) => (
                    img && (
                      <div key={idx} className={styles.thumb}>
                        <img src={img} alt={`Imagen ${idx + 2}`} />
                      </div>
                    )
                  ))}
                  {data.images.length > 4 && (
                    <div className={styles.thumb}>
                      <span>+{data.images.length - 4}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Product Info */}
          <div className={styles.previewInfo}>
            <h4 className={styles.previewTitle}>{data.name || 'Nombre del Producto'}</h4>
            <p className={styles.previewCategory}>{categoryName}</p>

            {data.shortDescription && (
              <p className={styles.previewShortDesc}>{data.shortDescription}</p>
            )}

            <div className={styles.previewDescription}>
              {data.description}
            </div>

            {/* Variants Preview */}
            {data.variants && data.variants.length > 0 && (
              <div className={styles.variantsPreview}>
                <h5>Variantes ({data.variants.length})</h5>
                <ul>
                  {data.variants.map((variant) => (
                    <li key={variant.id}>
                      <span className={styles.variantName}>{variant.name}</span>
                      <span className={styles.variantPrice}>${variant.price}</span>
                      <span className={styles.variantStock}>Stock: {variant.stock}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p>💡 Una vez publicado, el producto será visible en el catálogo. Puedes editarlo después si lo necesitas.</p>
      </div>
    </div>
  );
}
