/**
 * features/admin/collections/AdminCollectionForm.tsx
 * Formulario para crear/editar colecciones.
 */

import React, { useState, useEffect, useCallback, useId, useMemo } from 'react';
import { useBlocker } from 'react-router-dom';
import type { Collection } from './collectionsService';
import { collectionsService } from './collectionsService';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { Modal } from '../../../components/ui/Modal';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { ProductSelector } from './ProductSelector';
import styles from './AdminCollections.module.css';

type RequiredFieldKey = 'name' | 'slug' | 'displayPosition' | 'productIds';

const REQUIRED_FIELD_LABELS: Record<RequiredFieldKey, string> = {
  name: 'Nombre',
  slug: 'Slug',
  displayPosition: 'Posición de Display',
  productIds: 'Productos en la colección',
};

function getMissingRequiredFields(formData: {
  name: string;
  slug: string;
  displayPosition: 'home' | 'category';
  productIds: string[];
}): RequiredFieldKey[] {
  const missingFields: RequiredFieldKey[] = [];

  if (!formData.name.trim()) {
    missingFields.push('name');
  }

  if (!formData.slug.trim()) {
    missingFields.push('slug');
  }

  if (!formData.displayPosition) {
    missingFields.push('displayPosition');
  }

  if (!formData.productIds.length) {
    missingFields.push('productIds');
  }

  return missingFields;
}

function getFieldErrors(missingFields: RequiredFieldKey[]) {
  const errors: {
    name?: string;
    slug?: string;
    displayPosition?: string;
    productIds?: string;
  } = {};

  for (const field of missingFields) {
    errors[field] =
      field === 'productIds'
        ? 'Debes seleccionar al menos un producto'
        : `${REQUIRED_FIELD_LABELS[field]} es obligatorio`;
  }

  return errors;
}

interface Props {
  collection?: Collection | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const AdminCollectionForm: React.FC<Props> = ({ collection, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    displayPosition: 'home' | 'category';
    displayOrder: number;
    imageUrl: string;
    isActive: boolean;
    productIds: string[];
  }>({
    name: '',
    slug: '',
    displayPosition: 'home',
    displayOrder: 0,
    imageUrl: '',
    isActive: true,
    productIds: [],
  });

  const [error, setError] = useState<string | null>(null);
  const [missingRequiredFields, setMissingRequiredFields] = useState<RequiredFieldKey[]>([]);
  // Validaciones por campo
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    slug?: string;
    displayPosition?: string;
    productIds?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const missingFieldsDescriptionId = useId();

  // ─── Initial state snapshot (for dirty detection) ────────────────────────
  const [initialFormData] = useState(() => collection ? {
    name: collection.name,
    slug: collection.slug,
    displayPosition: collection.displayPosition,
    displayOrder: collection.displayOrder,
    imageUrl: collection.imageUrl || '',
    isActive: collection.isActive,
    productIds: collection.products?.map((p) => p.id) ?? [] as string[],
  } : {
    name: '',
    slug: '',
    displayPosition: 'home' as 'home' | 'category',
    displayOrder: 0,
    imageUrl: '',
    isActive: true,
    productIds: [] as string[],
  });

  const isDirty = useMemo(() =>
    JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]);

  const {
    showWarning,
    confirmNavigation,
    cancelNavigation,
    interceptNavigation,
    setIsDirty: setHookIsDirty,
  } = useUnsavedChangesWarning({ active: isDirty });

  useEffect(() => {
    setHookIsDirty(isDirty);
  }, [isDirty, setHookIsDirty]);

  const blocker = useBlocker(isDirty);

  const handleCancel = useCallback(() => {
    interceptNavigation(() => onCancel());
  }, [interceptNavigation, onCancel]);

  useEffect(() => {
    if (collection) {
      const initialProductIds = collection.products?.map((p) => p.id) || [];
      setFormData({
        name: collection.name,
        slug: collection.slug,
        displayPosition: collection.displayPosition,
        displayOrder: collection.displayOrder,
        imageUrl: collection.imageUrl || '',
        isActive: collection.isActive,
        productIds: initialProductIds,
      });
    } else {
      // Para nueva colección, calcular el siguiente displayOrder disponible
      calculateNextDisplayOrder();
    }
  }, [collection]);

  async function calculateNextDisplayOrder() {
    try {
      const allCollections = await collectionsService.getAllUnpaginated();
      // Encontrar el primer número disponible
      let nextOrder = 0;
      const usedOrders = new Set(allCollections.map(c => c.displayOrder));
      while (usedOrders.has(nextOrder)) {
        nextOrder++;
      }

      setFormData(prev => ({
        ...prev,
        displayOrder: nextOrder
      }));
    } catch (err) {
      console.error('Error calculating next display order:', err);
      // Si hay error, dejar el valor por defecto (0)
      setFormData(prev => ({
        ...prev,
        displayOrder: 0
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setMissingRequiredFields([]);
    setLoading(true);

    const missingFields = getMissingRequiredFields(formData);
    if (missingFields.length > 0) {
      setFieldErrors(getFieldErrors(missingFields));
      setMissingRequiredFields(missingFields);
      setLoading(false);
      return;
    }

    try {
      // Validar que el displayOrder sea único
      const allCollections = await collectionsService.getAllUnpaginated();
      const isDuplicateOrder = allCollections.some(
        c => c.displayOrder === formData.displayOrder && c.id !== collection?.id
      );

      if (isDuplicateOrder) {
        setError(`El orden de display ${formData.displayOrder} ya está en uso. Por favor, elige otro número.`);
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        displayOrder: Number(formData.displayOrder),
      };

      if (collection) {
        await collectionsService.update(collection.id, payload);
      } else {
        await collectionsService.create(payload);
      }
      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando colección');
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }

  const closeMissingFieldsModal = useCallback(() => {
    setMissingRequiredFields([]);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.formHeader}>
        <h1>{collection ? 'Editar Colección' : 'Nueva Colección'}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.formGroup}>
          <label htmlFor="collection-name">Nombre *</label>
          <input
            id="collection-name"
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({
                ...formData,
                name,
                slug: !collection ? generateSlug(name) : formData.slug,
              });
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Ej: Ofertas del Mes"
            className={fieldErrors.name ? `${styles.inputError}` : undefined}
            aria-invalid={!!fieldErrors.name}
          />
          {fieldErrors.name && (
            <span className={styles.fieldError}>{fieldErrors.name}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="collection-slug">Slug *</label>
          <input
            id="collection-slug"
            type="text"
            value={formData.slug}
            onChange={(e) => {
              setFormData({ ...formData, slug: e.target.value });
              setFieldErrors((prev) => ({ ...prev, slug: undefined }));
            }}
            placeholder="Ej: ofertas-del-mes"
            className={fieldErrors.slug ? styles.inputError : undefined}
            aria-invalid={!!fieldErrors.slug}
          />
          <small>URL amigable para acceder a esta colección</small>
          {fieldErrors.slug && (
            <span className={styles.fieldError}>{fieldErrors.slug}</span>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="collection-display-pos">Posición de Display *</label>
            <select
              id="collection-display-pos"
              value={formData.displayPosition}
              onChange={(e) =>
                {
                  setFormData({
                    ...formData,
                    displayPosition: e.target.value as Collection['displayPosition'],
                  });
                  setFieldErrors((prev) => ({ ...prev, displayPosition: undefined }));
                }
              }
              className={fieldErrors.displayPosition ? styles.inputError : undefined}
              aria-invalid={!!fieldErrors.displayPosition}
            >
              <option value="home">Home</option>
              <option value="category">Categoría</option>
            </select>
            {fieldErrors.displayPosition && (
              <span className={styles.fieldError}>{fieldErrors.displayPosition}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="collection-display-order">Orden de Display</label>
            <input
              id="collection-display-order"
              type="number"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({ ...formData, displayOrder: Number(e.target.value) })
              }
              placeholder="0"
            />
            <small>Menor número aparece primero</small>
          </div>
        </div>
        <div className={styles.formGroup}>
          <ProductSelector
            selectedIds={formData.productIds}
            onProductsChange={(productIds) => {
              setFormData({ ...formData, productIds });
              setFieldErrors((prev) => ({ ...prev, productIds: undefined }));
            }}
            initialProducts={
              collection?.products?.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                imageUrl: p.imageUrl,
              })) ?? []
            }
          />
          {fieldErrors.productIds && (
            <span className={styles.fieldError}>{fieldErrors.productIds}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            Activo
          </label>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? 'Guardando...' : collection ? 'Actualizar' : 'Crear'}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={handleCancel} disabled={loading}>
            Cancelar
          </button>
        </div>
      </form>

      {/* Unsaved changes warning */}
      <ModalConfirm
        open={showWarning || blocker.state === 'blocked'}
        title="¿Abandonar sin guardar?"
        message="Tenés cambios sin guardar. ¿Estás seguro de que querés abandonar?"
        confirmText="Sí, abandonar"
        cancelText="Seguir editando"
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed();
          confirmNavigation();
        }}
        onCancel={() => {
          if (blocker.state === 'blocked') blocker.reset();
          cancelNavigation();
        }}
      />

      <Modal
        open={missingRequiredFields.length > 0}
        onClose={closeMissingFieldsModal}
        role="alertdialog"
        title="No se puede guardar la colección"
        size="sm"
        className={styles.requiredFieldsModal}
        ariaDescribedBy={missingFieldsDescriptionId}
        actions={(
          <button
            type="button"
            className={styles.requiredFieldsAction}
            onClick={closeMissingFieldsModal}
          >
            Entendido
          </button>
        )}
      >
        <div className={styles.requiredFieldsContent}>
          <p id={missingFieldsDescriptionId} className={styles.requiredFieldsSummary}>
            Completá los campos obligatorios antes de crear o actualizar la colección.
          </p>
          <ul className={styles.requiredFieldsList}>
            {missingRequiredFields.map((field) => (
              <li key={field}>{REQUIRED_FIELD_LABELS[field]}</li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCollectionForm;
