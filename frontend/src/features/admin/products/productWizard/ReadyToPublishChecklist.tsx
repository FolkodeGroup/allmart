import { Check, AlertCircle, X } from 'lucide-react';
import styles from './ProductWizard.module.css';
import type { WizardProduct } from './types';

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  isComplete: boolean;
  status: 'complete' | 'incomplete' | 'warning';
}

interface ReadyToPublishChecklistProps {
  data: Partial<WizardProduct>;
  showDetails?: boolean;
  compact?: boolean;
}

export function ReadyToPublishChecklist({
  data,
  showDetails = true,
  compact = false,
}: ReadyToPublishChecklistProps) {
  // Validation logic for each checklist item
  const hasName = !!(data.name && data.name.trim().length > 0);
  const hasCategory = !!data.categoryId;
  const hasDescription = !!(data.description && data.description.trim().length > 0);
  const hasVariants = !!(data.variants && data.variants.length > 0);
  const hasImages = !!(data.images && data.images.filter((img) => img).length > 0);

  // SKU validation - check if main product has SKU or if all variants have unique SKUs
  let hasUniqueSku = false;
  let skuStatus: 'complete' | 'incomplete' | 'warning' = 'incomplete';
  if (data.sku && data.sku.trim().length > 0) {
    hasUniqueSku = true;
    skuStatus = 'complete';
  } else if (hasVariants && data.variants) {
    const skus = data.variants.map((v) => v.sku).filter((s) => s && s.trim().length > 0);
    const uniqueSkus = new Set(skus);
    if (skus.length === data.variants.length && uniqueSkus.size === skus.length) {
      hasUniqueSku = true;
      skuStatus = 'complete';
    } else if (skus.length > 0 && uniqueSkus.size === skus.length) {
      hasUniqueSku = true;
      skuStatus = 'warning';
    }
  }

  // Price validation - check if main product has price or all variants have prices
  let hasPriceDefined = false;
  let priceStatus: 'complete' | 'incomplete' | 'warning' = 'incomplete';
  if (data.price && data.price > 0) {
    hasPriceDefined = true;
    priceStatus = 'complete';
  } else if (hasVariants && data.variants) {
    const prices = data.variants.filter((v) => v.price && v.price > 0);
    if (prices.length === data.variants.length) {
      hasPriceDefined = true;
      priceStatus = 'complete';
    } else if (prices.length > 0) {
      hasPriceDefined = true;
      priceStatus = 'warning';
    }
  }

  // Build checklist items
  const checklistItems: ChecklistItem[] = [
    {
      id: 'name',
      label: 'Nombre del producto',
      description: 'Título descriptivo del producto',
      isComplete: hasName,
      status: hasName ? 'complete' : 'incomplete',
    },
    {
      id: 'category',
      label: 'Categoría',
      description: 'Debe estar asignado a una categoría',
      isComplete: hasCategory,
      status: hasCategory ? 'complete' : 'incomplete',
    },
    {
      id: 'description',
      label: 'Descripción',
      description: 'Descripción detallada del producto',
      isComplete: hasDescription,
      status: hasDescription ? 'complete' : 'incomplete',
    },
    {
      id: 'variants',
      label: `Variante${hasVariants && data.variants!.length > 1 ? 's' : ''} (${data.variants?.length || 0})`,
      description: 'Al menos una variante con precio y stock',
      isComplete: hasVariants,
      status: hasVariants ? 'complete' : 'incomplete',
    },
    {
      id: 'images',
      label: `Imagen${hasImages && data.images!.length > 1 ? 's' : ''} (${data.images?.filter((img) => img).length || 0})`,
      description: 'Al menos una imagen del producto',
      isComplete: hasImages,
      status: hasImages ? 'complete' : 'incomplete',
    },
    {
      id: 'sku',
      label: 'SKU único',
      description: 'Código único del producto o variantes',
      isComplete: hasUniqueSku,
      status: skuStatus,
    },
    {
      id: 'price',
      label: 'Precio definido',
      description: 'Precio principal o de todas las variantes',
      isComplete: hasPriceDefined,
      status: priceStatus,
    },
  ];

  const allComplete = checklistItems.every((item) => item.isComplete);
  const incompleteItems = checklistItems.filter((item) => !item.isComplete);


  if (compact) {
    return (
      <div className={styles.checklistSection}>
        <div className={styles.checklist}>
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={[
                styles.checklistItem,
                item.status === 'complete' ? styles.complete : '',
                item.status === 'warning' ? styles.warning : '',
                item.status === 'incomplete' ? styles.incomplete : '',
              ].join(' ')}
            >
              <div className={styles.checklistIcon}>
                {item.status === 'complete' && <Check size={18} />}
                {item.status === 'incomplete' && <X size={18} />}
                {item.status === 'warning' && <AlertCircle size={18} />}
              </div>
              <div className={styles.checklistContent}>
                <strong>{item.label}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checklistSection}>
      <h3 className={styles.sectionTitle}>
        Requisitos para Publicación
        {allComplete && ' ✓'}
      </h3>

      <div className={styles.checklist}>
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className={[
              styles.checklistItem,
              item.status === 'complete' ? styles.complete : '',
              item.status === 'warning' ? styles.warning : '',
              item.status === 'incomplete' ? styles.incomplete : '',
            ].join(' ')}
          >
            <div className={styles.checklistIcon}>
              {item.status === 'complete' && <Check size={18} />}
              {item.status === 'incomplete' && <X size={18} />}
              {item.status === 'warning' && <AlertCircle size={18} />}
            </div>
            <div className={styles.checklistContent}>
              <strong>{item.label}</strong>
              {showDetails && item.description && (
                <p>{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showDetails && (
        <div className={styles.statusSection}>
          {allComplete ? (
            <div className={styles.successBox}>
              <Check size={20} />
              <p>¡Todo listo! El producto está listo para ser publicado</p>
            </div>
          ) : (
            <div className={styles.warningBox}>
              <AlertCircle size={20} />
              <p>
                Completá los {incompleteItems.length} campo{incompleteItems.length !== 1 ? 's' : ''} faltante{incompleteItems.length !== 1 ? 's' : ''} para poder publicar:{' '}
                <strong>{incompleteItems.map((item) => item.label).join(', ')}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook para validar si un producto está listo para publicación
 */
export function useReadyToPublish(data: Partial<WizardProduct>): {
  isReady: boolean;
  items: ChecklistItem[];
  incompleteItems: ChecklistItem[];
} {
  // Reuse the checklist logic
  const hasName = !!(data.name && data.name.trim().length > 0);
  const hasCategory = !!data.categoryId;
  const hasDescription = !!(data.description && data.description.trim().length > 0);
  const hasVariants = !!(data.variants && data.variants.length > 0);
  const hasImages = !!(data.images && data.images.filter((img) => img).length > 0);

  let hasUniqueSku = false;
  let skuStatus: 'complete' | 'incomplete' | 'warning' = 'incomplete';
  if (data.sku && data.sku.trim().length > 0) {
    hasUniqueSku = true;
    skuStatus = 'complete';
  } else if (hasVariants && data.variants) {
    const skus = data.variants.map((v) => v.sku).filter((s) => s && s.trim().length > 0);
    const uniqueSkus = new Set(skus);
    if (skus.length === data.variants.length && uniqueSkus.size === skus.length) {
      hasUniqueSku = true;
      skuStatus = 'complete';
    } else if (skus.length > 0 && uniqueSkus.size === skus.length) {
      hasUniqueSku = true;
      skuStatus = 'warning';
    }
  }

  let hasPriceDefined = false;
  let priceStatus: 'complete' | 'incomplete' | 'warning' = 'incomplete';
  if (data.price && data.price > 0) {
    hasPriceDefined = true;
    priceStatus = 'complete';
  } else if (hasVariants && data.variants) {
    const prices = data.variants.filter((v) => v.price && v.price > 0);
    if (prices.length === data.variants.length) {
      hasPriceDefined = true;
      priceStatus = 'complete';
    } else if (prices.length > 0) {
      hasPriceDefined = true;
      priceStatus = 'warning';
    }
  }

  const items: ChecklistItem[] = [
    {
      id: 'name',
      label: 'Nombre del producto',
      isComplete: hasName,
      status: hasName ? 'complete' : 'incomplete',
    },
    {
      id: 'category',
      label: 'Categoría',
      isComplete: hasCategory,
      status: hasCategory ? 'complete' : 'incomplete',
    },
    {
      id: 'description',
      label: 'Descripción',
      isComplete: hasDescription,
      status: hasDescription ? 'complete' : 'incomplete',
    },
    {
      id: 'variants',
      label: 'Variante(s)',
      isComplete: hasVariants,
      status: hasVariants ? 'complete' : 'incomplete',
    },
    {
      id: 'images',
      label: 'Imagen(es)',
      isComplete: hasImages,
      status: hasImages ? 'complete' : 'incomplete',
    },
    {
      id: 'sku',
      label: 'SKU único',
      isComplete: hasUniqueSku,
      status: skuStatus,
    },
    {
      id: 'price',
      label: 'Precio definido',
      isComplete: hasPriceDefined,
      status: priceStatus,
    },
  ];

  const isReady = items.every((item) => item.isComplete);
  const incompleteItems = items.filter((item) => !item.isComplete);

  return { isReady, items, incompleteItems };
}
