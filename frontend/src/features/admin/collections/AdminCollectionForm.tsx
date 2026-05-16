/**
 * features/admin/collections/AdminCollectionForm.tsx
 * Formulario para crear/editar colecciones.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBlocker } from 'react-router-dom';
import type { Collection } from './collectionsService';
import { collectionsService } from './collectionsService';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { ProductSelector } from './ProductSelector';
import styles from './AdminCollections.module.css';

interface Props {
  collection?: Collection | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const AdminCollectionForm: React.FC<Props> = ({ collection, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    displayPosition: 'home' | 'category';
    displayOrder: number;
    imageUrl: string;
    isActive: boolean;
    productIds: string[];
  }>({
    name: '',
    slug: '',
    description: '',
    displayPosition: 'home',
    displayOrder: 0,
    imageUrl: '',
    isActive: true,
    productIds: [],
  });

  const [error, setError] = useState<string | null>(null);
  // Validaciones por campo
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    description?: string;
    productIds?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  // ─── Initial state snapshot (for dirty detection) ────────────────────────
  const [initialFormData] = useState(() => collection ? {
    name: collection.name,
    slug: collection.slug,
    description: collection.description || '',
    displayPosition: collection.displayPosition,
    displayOrder: collection.displayOrder,
    imageUrl: collection.imageUrl || '',
    isActive: collection.isActive,
    productIds: collection.products?.map((p) => p.id) ?? [] as string[],
  } : {
    name: '',
    slug: '',
    description: '',
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
        description: collection.description || '',
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
    setLoading(true);

    // Validaciones estrictas
    const errors: { name?: string; description?: string; productIds?: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }
    if (!formData.description.trim()) {
      errors.description = 'La descripción es obligatoria';
    }
    if (!formData.productIds || formData.productIds.length === 0) {
      errors.productIds = 'Debes seleccionar al menos un producto';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="Ej: ofertas-del-mes"
          />
          <small>URL amigable para acceder a esta colección</small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="collection-desc">Descripción *</label>
          <textarea
            id="collection-desc"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              setFieldErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="Detalles y descripción"
            rows={3}
            className={fieldErrors.description ? `${styles.inputError}` : undefined}
            aria-invalid={!!fieldErrors.description}
          />
          {fieldErrors.description && (
            <span className={styles.fieldError}>{fieldErrors.description}</span>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="collection-display-pos">Posición de Display *</label>
            <select
              id="collection-display-pos"
              value={formData.displayPosition}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  displayPosition: e.target.value as Collection['displayPosition'],
                })
              }
            >
              <option value="home">Home</option>
              <option value="category">Categoría</option>
            </select>
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
            disabled={loading || !!fieldErrors.name || !!fieldErrors.description || !!fieldErrors.productIds}
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
    </div>
  );
};

export default AdminCollectionForm;
