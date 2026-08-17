/**
 * features/admin/collections/AdminCollectionForm.tsx
 * Formulario estandarizado para crear/editar colecciones (Manual, Top Ventas y Reglas Dinámicas).
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
import { ArrowLeft, Layers, Zap, CheckCircle2, RotateCcw, Filter } from 'lucide-react';
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
      requiredTag: string;
      minDiscount: number;
      inStockOnly: boolean;
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
      requiredTag: '',
      minDiscount: 0,
      inStockOnly: true,
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

  const typeOptions = useMemo(() => [
    { value: 'manual', label: 'Manual — El administrador elige los productos' },
    { value: 'auto_sales', label: 'Automática — Top vendidos por categoría' },
    { value: 'dynamic_rules', label: 'Reglas Dinámicas — Filtro automático por tags/descuentos' }
  ], []);

  const positionOptions = useMemo(() => [
    { value: 'home', label: 'Home (Página de inicio)' },
    { value: 'category', label: 'Categoría Específica' }
  ], []);

  const categoryOptions = useMemo(() => [
    { value: '', label: '— Todas las categorías —' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
  ], [categories]);

  const windowOptions = useMemo(() => [
    { value: '7', label: 'Última semana (7 días)' },
    { value: '30', label: 'Último mes (30 días)' },
    { value: '60', label: 'Últimos 2 meses (60 días)' },
    { value: '90', label: 'Últimos 3 meses (90 días)' },
    { value: '365', label: 'Último año (365 días)' }
  ], []);

  const tagOptions = useMemo(() => [
    { value: '', label: 'Cualquier etiqueta' },
    { value: 'oferta', label: '🏷️ Oferta' },
    { value: 'destacado', label: '⭐ Destacado' },
    { value: 'novedad', label: '🆕 Novedad' }
  ], []);

  useEffect(() => {
    apiFetch<{ data: SimpleCategory[] }>('/api/categories')
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

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
          requiredTag: collection.params?.requiredTag ?? '',
          minDiscount: collection.params?.minDiscount ?? 0,
          inStockOnly: collection.params?.inStockOnly ?? true,
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
          requiredTag: '',
          minDiscount: 0,
          inStockOnly: true,
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
          requiredTag: collection.params?.requiredTag ?? '',
          minDiscount: collection.params?.minDiscount ?? 0,
          inStockOnly: collection.params?.inStockOnly ?? true,
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
      setSyncMsg('✓ Colección sincronizada con las reglas actuales');
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
          `El orden de display ${formData.displayOrder} ya está en uso. Por favor, elegí otro número.`
        );
        setLoading(false);
        return;
      }

      const paramsPayload =
        formData.type === 'auto_sales'
          ? {
            categoryId: formData.params.categoryId || undefined,
            windowDays: formData.params.windowDays,
            limit: formData.params.limit,
            pinnedProductIds: formData.params.pinnedProductIds,
            excludeProductIds: formData.params.excludeProductIds,
          }
          : formData.type === 'dynamic_rules'
          ? {
            categoryId: formData.params.categoryId || undefined,
            requiredTag: formData.params.requiredTag || undefined,
            minDiscount: Number(formData.params.minDiscount) || undefined,
            inStockOnly: formData.params.inStockOnly,
            limit: formData.params.limit,
          }
          : {
            categoryId: formData.displayPosition === 'category' ? (formData.params.categoryId || undefined) : undefined,
          };

      const payload = {
        name: formData.name,
        slug: formData.slug,
        displayPosition: formData.displayPosition,
        displayOrder: Number(formData.displayOrder),
        imageUrl: formData.imageUrl || undefined,
        isActive: formData.isActive,
        type: formData.type,
        params: paramsPayload,
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
  const isDynamicRules = formData.type === 'dynamic_rules';

  return (
    <div className={styles.formPageWrapper}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.backBtn}
            aria-label="Volver al listado de colecciones"
          >
            <ArrowLeft size={14} />
            Colecciones
          </button>
          <h1 className={styles.pageTitle}>
            {collection ? `Editar colección: ${collection.name}` : 'Nueva colección'}
          </h1>
        </div>
        <div className={styles.pageHeaderActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : collection ? 'Guardar cambios' : 'Crear colección'}
          </button>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {syncMsg && <div className={styles.successMsg}>{syncMsg}</div>}

      <form onSubmit={handleSubmit} className={styles.formUnified} noValidate>

        {/* ── SECCIÓN 1: INFORMACIÓN BÁSICA ── */}
        <section className={styles.formCardSection}>
          <h2 className={styles.formCardTitle}>
            <Layers size={18} />
            Información Básica
          </h2>

          <div className={styles.formGroup}>
            <label htmlFor="collection-type">Tipo de colección</label>
            <Dropdown
              id="collection-type"
              options={typeOptions}
              value={formData.type}
              onChange={(val) => setFormData({ ...formData, type: val })}
              placeholder="Seleccionar tipo..."
            />
            <small>
              {isAutoSales && 'Los productos se calculan automáticamente desde las ventas.'}
              {isDynamicRules && 'Los productos se filtran automáticamente en base a etiquetas y reglas de descuento.'}
              {formData.type === 'manual' && 'Vos elegís qué productos aparecen y en qué orden.'}
            </small>
          </div>

          <div className={styles.formRow}>
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
                placeholder={isAutoSales ? 'Ej: Más vendidos en Cocina' : 'Ej: Ofertas del Mes'}
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
                placeholder="Ej: ofertas-del-mes"
                className={fieldErrors.slug ? styles.inputError : undefined}
                aria-invalid={!!fieldErrors.slug}
              />
              <small>URL amigable para acceder a esta colección</small>
              {fieldErrors.slug && <span className={styles.fieldError}>{fieldErrors.slug}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="collection-display-pos">Posición de Display *</label>
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

          {formData.displayPosition === 'category' && (
            <div className={styles.formGroup} style={{ marginTop: '12px' }}>
              <label htmlFor="collection-category-context">Categoría Destino (Contexto de Filtro) *</label>
              <Dropdown
                id="collection-category-context"
                options={categoryOptions}
                value={formData.params.categoryId}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    params: { ...formData.params, categoryId: val },
                  })
                }
                placeholder="Seleccionar categoría..."
              />
              <small>
                Esta colección solo se mostrará cuando el usuario visite la categoría seleccionada o sus subcategorías.
              </small>
            </div>
          )}
        </section>

        {/* ── SECCIÓN 2: TIPO AUTO_SALES ── */}
        {isAutoSales && (
          <section className={styles.formCardSection}>
            <h2 className={styles.formCardTitle}>
              <Zap size={18} />
              Configuración Automática por Ventas
            </h2>

            <div className={styles.formRow3Col}>
              <div className={styles.formGroup}>
                <label htmlFor="auto-category">Categoría (opcional)</label>
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
                <small>Dejar vacío para mostrar top global de ventas</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="auto-window">Ventana de tiempo (días)</label>
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

            {collection && (
              <div className={styles.syncRow}>
                <button
                  type="button"
                  className={styles.btnSync}
                  onClick={handleSyncNow}
                  disabled={syncing}
                >
                  <RotateCcw size={14} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
                </button>
                {collection.snapshotAt && (
                  <span className={styles.syncInfo}>
                    Última sincronización:{' '}
                    {new Date(collection.snapshotAt).toLocaleString('es-AR')}
                  </span>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── SECCIÓN 2B: TIPO DYNAMIC_RULES ── */}
        {isDynamicRules && (
          <section className={styles.formCardSection}>
            <h2 className={styles.formCardTitle}>
              <Filter size={18} />
              Configuración de Reglas Dinámicas
            </h2>

            <div className={styles.formRow3Col}>
              <div className={styles.formGroup}>
                <label htmlFor="dynamic-category">Categoría Filtro (opcional)</label>
                <Dropdown
                  id="dynamic-category"
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
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="dynamic-tag">Etiqueta Requerida</label>
                <Dropdown
                  id="dynamic-tag"
                  options={tagOptions}
                  value={formData.params.requiredTag}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      params: { ...formData.params, requiredTag: val },
                    })
                  }
                  placeholder="Cualquier etiqueta"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="dynamic-limit">Límite de productos</label>
                <input
                  id="dynamic-limit"
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
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.checkboxRow} htmlFor="dynamic-instock-check">
                  <input
                    id="dynamic-instock-check"
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={formData.params.inStockOnly}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        params: { ...formData.params, inStockOnly: e.target.checked },
                      })
                    }
                  />
                  <span className={styles.checkboxLabelText}>Solo productos con stock disponible</span>
                </label>
              </div>
            </div>

            {collection && (
              <div className={styles.syncRow}>
                <button
                  type="button"
                  className={styles.btnSync}
                  onClick={handleSyncNow}
                  disabled={syncing}
                >
                  <RotateCcw size={14} />
                  {syncing ? 'Sincronizando...' : 'Evaluar reglas ahora'}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── SECCIÓN 2C: TIPO MANUAL ── */}
        {formData.type === 'manual' && (
          <section className={styles.formCardSection}>
            <h2 className={styles.formCardTitle}>
              <Layers size={18} />
              Productos en la Colección
            </h2>

            <div className={styles.formGroup}>
              <ProductSelector
                selectedIds={formData.productIds}
                onProductsChange={(productIds) => {
                  setFormData({ ...formData, productIds });
                  setFieldErrors((prev) => ({ ...prev, productIds: undefined }));
                }}
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
          </section>
        )}

        {/* ── SECCIÓN 3: ESTADO Y PUBLICACIÓN ── */}
        <section className={styles.formCardSection}>
          <h2 className={styles.formCardTitle}>
            <CheckCircle2 size={18} />
            Estado de Publicación
          </h2>

          <div className={styles.formGroup}>
            <label className={styles.checkboxRow} htmlFor="collection-active-check">
              <input
                id="collection-active-check"
                type="checkbox"
                className={styles.checkboxInput}
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span className={styles.checkboxLabelText}>Colección activa (visible en la plataforma)</span>
            </label>
          </div>
        </section>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Guardando...' : collection ? 'Guardar cambios' : 'Crear colección'}
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>

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