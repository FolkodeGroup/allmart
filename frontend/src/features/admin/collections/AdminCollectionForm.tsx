/**
 * features/admin/collections/AdminCollectionForm.tsx
 * Formulario para crear/editar colecciones (manual y auto_sales).
 */

import React, { useState, useEffect, useCallback, useId, useMemo } from 'react';
import { useBlocker } from 'react-router-dom';
import type { Collection } from './collectionsService';
import { collectionsService } from './collectionsService';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { Modal } from '../../../components/ui/Modal';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { ProductSelector } from './ProductSelector';
import { apiFetch } from '../../../utils/apiClient';
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';
import { useAdminProducts } from '../../../context/useAdminProductsContext';
import { normalizeImageUrl } from '../../../utils/imageUrl';
import styles from './AdminCollections.module.css';

type RequiredFieldKey = 'name' | 'slug' | 'displayPosition' | 'productIds';

const REQUIRED_FIELD_LABELS: Record<RequiredFieldKey, string> = {
  name: 'Nombre',
  slug: 'Slug',
  displayPosition: 'Posición de Display',
  productIds: 'Productos en la colección',
};

interface SimpleCategory {
  id: string;
  name: string;
}

function getMissingRequiredFields(formData: {
  name: string;
  slug: string;
  displayPosition: 'home' | 'category';
  productIds: string[];
  type: string;
}): RequiredFieldKey[] {
  const missingFields: RequiredFieldKey[] = [];
  if (!formData.name.trim()) missingFields.push('name');
  if (!formData.slug.trim()) missingFields.push('slug');
  if (!formData.displayPosition) missingFields.push('displayPosition');
  // Solo requerir productos para colecciones manuales
  if (formData.type === 'manual' && !formData.productIds.length) {
    missingFields.push('productIds');
  }
  return missingFields;
}

function getFieldErrors(missingFields: RequiredFieldKey[]) {
  const errors: { name?: string; slug?: string; displayPosition?: string; productIds?: string } = {};
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
  const { products: liveProducts } = useAdminProducts();

  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    displayPosition: 'home' | 'category';
    displayOrder: number;
    imageUrl: string;
    isActive: boolean;
    productIds: string[];
    type: string;
    params: {
      categoryId: string;
      windowDays: number;
      limit: number;
      pinnedProductIds: string[];
      excludeProductIds: string[];
    };
  }>({
    name: '',
    slug: '',
    displayPosition: 'home',
    displayOrder: 0,
    imageUrl: '',
    isActive: true,
    productIds: [],
    type: 'manual',
    params: {
      categoryId: '',
      windowDays: 30,
      limit: 10,
      pinnedProductIds: [],
      excludeProductIds: [],
    },
  });

  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingRequiredFields, setMissingRequiredFields] = useState<RequiredFieldKey[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    slug?: string;
    displayPosition?: string;
    productIds?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const missingFieldsDescriptionId = useId();

  // ─── Opciones para Dropdowns Unificados ─────────────────────────────────────
  const typeOptions = useMemo(() => [
    { value: 'manual', label: 'Manual — el admin elige los productos' },
    { value: 'auto_sales', label: 'Automática — top vendidos por categoría' }
  ], []);

  const positionOptions = useMemo(() => [
    { value: 'home', label: 'Home' },
    { value: 'category', label: 'Categoría' }
  ], []);

  const categoryOptions = useMemo(() => [
    { value: '', label: 'Todas las categorías' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
  ], [categories]);

  const windowOptions = useMemo(() => [
    { value: '7', label: 'Última semana (7 días)' },
    { value: '30', label: 'Último mes (30 días)' },
    { value: '60', label: 'Últimos 2 meses (60 días)' },
    { value: '90', label: 'Últimos 3 meses (90 días)' },
    { value: '365', label: 'Último año (365 días)' }
  ], []);

  // Cargar categorías para el selector de auto_sales
  useEffect(() => {
    apiFetch<{ data: SimpleCategory[] }>('/api/categories')
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  // ─── Initial state snapshot (for dirty detection) ────────────────────────
  const [initialFormData] = useState(() =>
    collection
      ? {
          name: collection.name,
          slug: collection.slug,
          displayPosition: collection.displayPosition,
          displayOrder: collection.displayOrder,
          imageUrl: collection.imageUrl || '',
          isActive: collection.isActive,
          productIds: collection.products?.map((p) => p.id) ?? ([] as string[]),
          type: collection.type ?? 'manual',
          params: {
            categoryId: collection.params?.categoryId ?? '',
            windowDays: collection.params?.windowDays ?? 30,
            limit: collection.params?.limit ?? 10,
            pinnedProductIds: collection.params?.pinnedProductIds ?? [],
            excludeProductIds: collection.params?.excludeProductIds ?? [],
          },
        }
      : {
          name: '',
          slug: '',
          displayPosition: 'home' as 'home' | 'category',
          displayOrder: 0,
          imageUrl: '',
          isActive: true,
          productIds: [] as string[],
          type: 'manual',
          params: {
            categoryId: '',
            windowDays: 30,
            limit: 10,
            pinnedProductIds: [] as string[],
            excludeProductIds: [] as string[],
          },
        }
  );

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

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
      setFormData({
        name: collection.name,
        slug: collection.slug,
        displayPosition: collection.displayPosition,
        displayOrder: collection.displayOrder,
        imageUrl: collection.imageUrl || '',
        isActive: collection.isActive,
        productIds: collection.products?.map((p) => p.id) || [],
        type: collection.type ?? 'manual',
        params: {
          categoryId: collection.params?.categoryId ?? '',
          windowDays: collection.params?.windowDays ?? 30,
          limit: collection.params?.limit ?? 10,
          pinnedProductIds: collection.params?.pinnedProductIds ?? [],
          excludeProductIds: collection.params?.excludeProductIds ?? [],
        },
      });
    } else {
      calculateNextDisplayOrder();
    }
  }, [collection]);

  async function calculateNextDisplayOrder() {
    try {
      const allCollections = await collectionsService.getAllUnpaginated();
      let nextOrder = 0;
      const usedOrders = new Set(allCollections.map((c) => c.displayOrder));
      while (usedOrders.has(nextOrder)) nextOrder++;
      setFormData((prev) => ({ ...prev, displayOrder: nextOrder }));
    } catch {
      setFormData((prev) => ({ ...prev, displayOrder: 0 }));
    }
  }

  async function handleSyncNow() {
    if (!collection) return;
    setSyncing(true);
    setSyncMsg(null);
    setError(null);
    try {
      await collectionsService.sync(collection.id);
      setSyncMsg('✓ Colección sincronizada con el top de ventas actual');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sincronizando colección');
    } finally {
      setSyncing(false);
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
      const allCollections = await collectionsService.getAllUnpaginated();
      const isDuplicateOrder = allCollections.some(
        (c) => c.displayOrder === formData.displayOrder && c.id !== collection?.id
      );
      if (isDuplicateOrder) {
        setError(
          `El orden de display ${formData.displayOrder} ya está en uso. Por favor, elige otro número.`
        );
        setLoading(false);
        return;
      }

      // Construir params solo para auto_sales
      const paramsPayload =
        formData.type === 'auto_sales'
          ? {
              categoryId: formData.params.categoryId || undefined,
              windowDays: formData.params.windowDays,
              limit: formData.params.limit,
              pinnedProductIds: formData.params.pinnedProductIds,
              excludeProductIds: formData.params.excludeProductIds,
            }
          : {};

      const payload = {
        name: formData.name,
        slug: formData.slug,
        displayPosition: formData.displayPosition,
        displayOrder: Number(formData.displayOrder),
        imageUrl: formData.imageUrl || undefined,
        isActive: formData.isActive,
        type: formData.type,
        params: paramsPayload,
        // Para manuales enviar productIds; para auto_sales no (el job lo gestiona)
        ...(formData.type === 'manual' && { productIds: formData.productIds }),
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

  const isAutoSales = formData.type === 'auto_sales';

  return (
    <div className={styles.container}>
      <div className={styles.formHeader}>
        <h1>{collection ? 'Editar Colección' : 'Nueva Colección'}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {syncMsg && <div className={styles.successMsg}>{syncMsg}</div>}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* ── Tipo de colección (Selector Unificado) ── */}
        <div className={styles.formGroup}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px', display: 'block' }}>Tipo de colección</span>
          <Dropdown
            id="collection-type"
            options={typeOptions}
            value={formData.type}
            onChange={(val) => setFormData({ ...formData, type: val })}
            placeholder="Seleccionar tipo..."
          />
          <small style={{ marginTop: '6px' }}>
            {isAutoSales
              ? 'Los productos se calculan automáticamente desde las ventas. Podés sincronizar manualmente o esperar el recálculo diario.'
              : 'Vos elegís qué productos aparecen y en qué orden.'}
          </small>
        </div>

        {/* ── Nombre y Slug ── */}
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
            placeholder={isAutoSales ? 'Ej: Más vendidos en Electrónica' : 'Ej: Ofertas del Mes'}
            className={fieldErrors.name ? styles.inputError : undefined}
            aria-invalid={!!fieldErrors.name}
          />
          {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
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
            placeholder="Ej: mas-vendidos-electronica"
            className={fieldErrors.slug ? styles.inputError : undefined}
            aria-invalid={!!fieldErrors.slug}
          />
          <small>URL amigable para acceder a esta colección</small>
          {fieldErrors.slug && <span className={styles.fieldError}>{fieldErrors.slug}</span>}
        </div>

        <div className={styles.formRow}>
          {/* ── Posición de Display (Selector Unificado) ── */}
          <div className={styles.formGroup}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px', display: 'block' }}>Posición de Display *</span>
            <Dropdown
              id="collection-display-pos"
              options={positionOptions}
              value={formData.displayPosition}
              onChange={(val) => {
                setFormData({
                  ...formData,
                  displayPosition: val as Collection['displayPosition'],
                });
                setFieldErrors((prev) => ({ ...prev, displayPosition: undefined }));
              }}
              placeholder="Seleccionar posición..."
            />
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

        {/* ── Parámetros de auto_sales ── */}
        {isAutoSales && (
          <fieldset className={styles.autoParamsFieldset}>
            <legend>Configuración automática por ventas</legend>

            <div className={styles.formRow}>
              {/* ── Categoría (Selector Unificado) ── */}
              <div className={styles.formGroup}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px', display: 'block' }}>Categoría (opcional)</span>
                <Dropdown
                  id="auto-category"
                  options={categoryOptions}
                  value={formData.params.categoryId}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      params: { ...formData.params, categoryId: val },
                    })
                  }
                  placeholder="Todas las categorías"
                />
                <small style={{ marginTop: '6px' }}>Dejar vacío para mostrar top global de ventas</small>
              </div>

              {/* ── Ventana de tiempo (Selector Unificado) ── */}
              <div className={styles.formGroup}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px', display: 'block' }}>Ventana de tiempo (días)</span>
                <Dropdown
                  id="auto-window"
                  options={windowOptions}
                  value={String(formData.params.windowDays)}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      params: { ...formData.params, windowDays: Number(val) },
                    })
                  }
                  placeholder="Seleccionar período..."
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="auto-limit">Cantidad de productos</label>
                <input
                  id="auto-limit"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.params.limit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      params: { ...formData.params, limit: Number(e.target.value) },
                    })
                  }
                />
                <small>Máximo recomendado: 10-12 productos</small>
              </div>
            </div>

            {/* Botón de Sincronización */}
            {collection && (
              <div className={styles.syncRow}>
                <button
                  type="button"
                  className={styles.btnSync}
                  onClick={handleSyncNow}
                  disabled={syncing}
                >
                  {syncing ? 'Sincronizando...' : '⟳ Sincronizar ahora'}
                </button>
                {collection.snapshotAt && (
                  <span className={styles.syncInfo}>
                    Última sincronización:{' '}
                    {new Date(collection.snapshotAt).toLocaleString('es-AR')}
                  </span>
                )}
                {!collection.snapshotAt && (
                  <span className={styles.syncInfo}>
                    Aún no sincronizada — los productos se calcularán al sincronizar
                  </span>
                )}
              </div>
            )}
          </fieldset>
        )}

        {/* ── Selector de productos (solo para manual) ── */}
        {!isAutoSales && (
          <div className={styles.formGroup}>
            <ProductSelector
              selectedIds={formData.productIds}
              onProductsChange={(productIds) => {
                setFormData({ ...formData, productIds });
                setFieldErrors((prev) => ({ ...prev, productIds: undefined }));
              }}
              // 🟢 MEJORA: Realiza la búsqueda cruzada por ID usando los productos cargados en el Admin
              initialProducts={
                collection?.products?.map((p) => {
                  const liveProduct = liveProducts.find((lp) => lp.id === p.id);
                  const liveImageUrl = liveProduct?.images?.[0];
                  return {
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    imageUrl: liveImageUrl && !liveImageUrl.includes('placeholder.png')
                      ? liveImageUrl
                      : (normalizeImageUrl(p.imageUrl) ?? undefined),
                  };
                }) ?? []
              }
            />
            {fieldErrors.productIds && (
              <span className={styles.fieldError}>{fieldErrors.productIds}</span>
            )}
          </div>
        )}

        <div className={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            {' '}Activo
          </label>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Guardando...' : collection ? 'Actualizar' : 'Crear'}
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleCancel}
            disabled={loading}
          >
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
        actions={
          <button
            type="button"
            className={styles.requiredFieldsAction}
            onClick={closeMissingFieldsModal}
          >
            Entendido
          </button>
        }
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