import { Check, AlertCircle } from 'lucide-react';
import styles from './ProductWizard.module.css';
import type { StepProps } from './types';

export function Step3ReviewPublish({ data, categories }: Omit<StepProps, 'onDataChange' | 'errors'>) {

  const categoryName = categories.find((c) => c.id === data.categoryId)?.name || 'N/A';

  // Checklist items
  const basicInfoComplete = !!(data.name && data.categoryId && data.description);
  const variantsComplete = !!(data.variants && data.variants.length > 0);
  const imagesComplete = !!(data.images && data.images.filter((img) => img).length > 0);

  const allFieldsComplete = basicInfoComplete && variantsComplete && imagesComplete;

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Revisar y Publicar</h2>
      <p className={styles.stepDescription}>Verifica que todo esté correcto antes de publicar</p>

      {/* Checklist */}
      <div className={styles.checklistSection}>
        <h3 className={styles.sectionTitle}>Checklist de Completitud</h3>
        <div className={styles.checklist}>
          <div className={`${styles.checklistItem} ${basicInfoComplete ? styles.complete : ''}`}>
            <div className={styles.checklistIcon}>
              {basicInfoComplete && <Check size={18} />}
            </div>
            <div className={styles.checklistContent}>
              <strong>Información Básica</strong>
              <p>Nombre, categoría y descripción</p>
            </div>
          </div>

          <div className={`${styles.checklistItem} ${variantsComplete ? styles.complete : ''}`}>
            <div className={styles.checklistIcon}>
              {variantsComplete && <Check size={18} />}
            </div>
            <div className={styles.checklistContent}>
              <strong>Variantes ({data.variants?.length || 0})</strong>
              <p>Precio y stock configurados</p>
            </div>
          </div>

          <div className={`${styles.checklistItem} ${imagesComplete ? styles.complete : ''}`}>
            <div className={styles.checklistIcon}>
              {imagesComplete && <Check size={18} />}
            </div>
            <div className={styles.checklistContent}>
              <strong>Imágenes ({data.images?.filter((img) => img).length || 0})</strong>
              <p>Al menos una imagen cargada</p>
            </div>
          </div>
        </div>
      </div>

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

      {/* Status */}
      <div className={styles.statusSection}>
        {!allFieldsComplete && (
          <div className={styles.warningBox}>
            <AlertCircle size={20} />
            <p>Completá todos los campos requeridos (*) para publicar el producto</p>
          </div>
        )}

        {allFieldsComplete && (
          <div className={styles.successBox}>
            <Check size={20} />
            <p>¡Todo listo! El producto está listo para ser publicado</p>
          </div>
        )}
      </div>

      <div className={styles.info}>
        <p>💡 Una vez publicado, el producto será visible en el catálogo. Puedes editarlo después si lo necesitas.</p>
      </div>
    </div>
  );
}
