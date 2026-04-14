import type { VariantGroup } from '../../../context/AdminProductsContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { logAdminActivity } from '../../../services/adminActivityLogService';
import type { AdminProduct } from '../../../context/AdminProductsContext';
import { useAdminProducts } from '../../../context/AdminProductsContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminImages } from '../../../context/AdminImagesContext';
import { sanitizeObject } from '../../../utils/security';
import type { ProductImageItem } from '../../../context/AdminImagesContext';
import styles from './AdminProductForm.module.css';
import { Modal } from '../../../components/ui/Modal';
import { TabsWrapper } from '../../../components/ui/TabsWrapper';
import type { TabDefinition } from '../../../components/ui/TabsWrapper';

import { TabBasico } from './tabs/TabBasico';
import { TabPreciosInventario } from './tabs/TabPreciosinventario';
import { TabCategorias } from './tabs/TabCategorias';
import { TabVariantes } from './tabs/TabVariantes';
import { TabImagenes } from './tabs/TabImagenes';
import { TabSEOPublicacion } from './tabs/TabSeoPublicacion';
import type { SetField } from './components/types';

const EMPTY: Omit<AdminProduct, 'id'> = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  price: 0,
  originalPrice: undefined,
  discount: undefined,
  images: [''],
  category: { id: '', name: '', slug: '', isVisible: true },
  categoryIds: [],
  tags: [],
  rating: 0,
  reviewCount: 0,
  inStock: true,
  isFeatured: false,
  sku: '',
  features: [],
  stock: 0,
  variants: [],
};

interface Props {
  productId?: string | null;
  onClose: () => void;
  onUnsavedChanges?: (unsaved: boolean) => void;
  resetUnsavedChanges?: () => void;
}

export function AdminProductForm({
  productId,
  onClose,
  onUnsavedChanges,
  resetUnsavedChanges,
}: Props) {
  // ── Hooks siempre en el mismo orden, sin condicionales ───────────────────
  const auth = useAdminAuth();
  const userEmail = (auth.user as { email?: string } | null)?.email ?? 'desconocido';

  const { addProduct, updateProduct, getProduct, loadProductVariants } = useAdminProducts();
  const { categories } = useAdminCategories();
  const {
    images: apiImages,
    isLoading: imagesLoading,
    error: imagesError,
    loadImages,
    uploadImage,
    updateImageMeta,
    deleteImage,
    clearImages,
  } = useAdminImages();

  const isEdit = !!productId;

  // ── Estado principal del formulario ─────────────────────────────────────
  const [form, setForm] = useState<Omit<AdminProduct, 'id'>>(EMPTY);
  const [initialForm, setInitialForm] = useState<Omit<AdminProduct, 'id'>>(EMPTY);
  const [, setUnsavedChanges] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // ── Estado local de inputs auxiliares ───────────────────────────────────
  const [tagInput, setTagInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupValues, setNewGroupValues] = useState<Record<string, string>>({});


  // ── Estado para gestión de imágenes via API (solo edición) ──────────────
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgNewAlt, setImgNewAlt] = useState('');
  const [imgError, setImgError] = useState('');
  const [showAddImgForm, setShowAddImgForm] = useState(false);
  const [editingImgId, setEditingImgId] = useState<string | null>(null);
  const [editingImgAlt, setEditingImgAlt] = useState('');
  const [savingImgId, setSavingImgId] = useState<string | null>(null);
  const [deletingImgId, setDeletingImgId] = useState<string | null>(null);
  // FIX: useRef<HTMLInputElement>(null) tipado correctamente — sin `| null` extra
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Inicialización ───────────────────────────────────────────────────────
  useEffect(() => {
    const initForm = async () => {
      if (productId) {
        const p = getProduct(productId);
        if (p) {
          const { id: _id, ...rest } = p;
          void _id;
          const variants = await loadProductVariants(productId);
          const loadedForm = { ...rest, variants: variants || [] };
          const normalizedCategoryIds =
            Array.isArray(loadedForm.categoryIds) && loadedForm.categoryIds.length > 0
              ? loadedForm.categoryIds
              : loadedForm.category?.id
                ? [loadedForm.category.id]
                : [];
          const formWithCategories = { ...loadedForm, categoryIds: normalizedCategoryIds };
          setForm(formWithCategories);
          setInitialForm(formWithCategories);
          loadImages(productId);
        }
      } else {
        setForm(EMPTY);
        setInitialForm(EMPTY);
        clearImages();
      }
      setError('');
      setFieldErrors({});
      setUnsavedChanges(false);
      if (onUnsavedChanges) onUnsavedChanges(false);
    };
    initForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // ── Detección de cambios pendientes ─────────────────────────────────────
  useEffect(() => {
    const isChanged = JSON.stringify(form) !== JSON.stringify(initialForm);
    setUnsavedChanges(isChanged);
    if (onUnsavedChanges) onUnsavedChanges(isChanged);
  }, [form, initialForm, onUnsavedChanges]);

  useEffect(() => {
    if (resetUnsavedChanges) setUnsavedChanges(false);
  }, [resetUnsavedChanges]);

  // ── Setter tipado para campos del formulario ─────────────────────────────
  const setField = useCallback<SetField>((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }, []);

  // ── Validación (sin modificar) ───────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!form.price || form.price <= 0) errors.price = 'El precio debe ser mayor a 0';
    if (!form.category.id) errors.category = 'Seleccioná una categoría';

    if (form.discount !== undefined && (form.discount < 0 || form.discount > 100)) {
      errors.discount = 'El descuento debe estar entre 0 y 100';
    }
    if (form.originalPrice !== undefined && form.originalPrice <= 0) {
      errors.originalPrice = 'El precio original debe ser mayor a 0';
    }
    if (form.stock < 0) {
      errors.stock = 'El stock no puede ser negativo';
    }
    if (!isEdit) {
      const invalidImgs = form.images.filter(
        url => url.trim() !== '' && !url.startsWith('http')
      );
      if (invalidImgs.length > 0) {
        errors.images = 'Todas las URLs de imágenes deben ser válidas (http/https)';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Handlers de variantes ────────────────────────────────────────────────
  const addVariantGroup = useCallback(() => {
    const name = newGroupName.trim();
    if (!name) return;
    const g: VariantGroup = { id: `g-${Date.now()}`, name, values: [] };
    setField('variants', [...(form.variants ?? []), g]);
    setNewGroupName('');
  }, [newGroupName, form.variants, setField]);

  const removeVariantGroup = useCallback(
    (groupId: string) =>
      setField('variants', (form.variants ?? []).filter(g => g.id !== groupId)),
    [form.variants, setField]
  );

  const addVariantValue = useCallback(
    (groupId: string) => {
      const val = (newGroupValues[groupId] ?? '').trim();
      if (!val) return;
      setField(
        'variants',
        (form.variants ?? []).map(g =>
          g.id === groupId && !g.values.includes(val)
            ? { ...g, values: [...g.values, val] }
            : g
        )
      );
      setNewGroupValues(prev => ({ ...prev, [groupId]: '' }));
    },
    [newGroupValues, form.variants, setField]
  );

  const removeVariantValue = useCallback(
    (groupId: string, value: string) =>
      setField(
        'variants',
        (form.variants ?? []).map(g =>
          g.id === groupId ? { ...g, values: g.values.filter(v => v !== value) } : g
        )
      ),
    [form.variants, setField]
  );

  // ── Submit (sin modificar lógica, solo se elimina `any` explícito) ───────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError('');
    setSaving(true);
    const sanitizedForm = sanitizeObject(form);

    try {
      if (isEdit && productId) {
        const { images: _omitted, ...formWithoutImages } = sanitizedForm;
        void _omitted;
        await updateProduct(productId, formWithoutImages as Partial<AdminProduct>);
        logAdminActivity({
          timestamp: new Date().toISOString(),
          user: userEmail,
          action: 'edit',
          entity: 'product',
          entityId: productId,
          details: { ...formWithoutImages },
        });
      } else {
        // FIX: tipamos el resultado como `AdminProduct` en vez de `any`
        const created = await addProduct(sanitizedForm) as AdminProduct;
        logAdminActivity({
          timestamp: new Date().toISOString(),
          user: userEmail,
          action: 'create',
          entity: 'product',
          entityId: created?.id,
          details: { ...sanitizedForm },
        });
      }
      setUnsavedChanges(false);
      if (onUnsavedChanges) onUnsavedChanges(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  // ── Handlers de tags ─────────────────────────────────────────────────────
  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setField('tags', [...form.tags, t]);
    setTagInput('');
  }, [tagInput, form.tags, setField]);

  const removeTag = useCallback(
    (tag: string) => setField('tags', form.tags.filter(t => t !== tag)),
    [form.tags, setField]
  );

  // ── Handlers de features ─────────────────────────────────────────────────
  const addFeature = useCallback(() => {
    const f = featureInput.trim();
    if (f) setField('features', [...(form.features ?? []), f]);
    setFeatureInput('');
  }, [featureInput, form.features, setField]);

  const removeFeature = useCallback(
    (i: number) => setField('features', (form.features ?? []).filter((_, idx) => idx !== i)),
    [form.features, setField]
  );


  // ── Handlers de imágenes (URL, modo creación) ────────────────────────────
  const setImage = useCallback(
    (i: number, val: string) => {
      const imgs = [...form.images];
      imgs[i] = val;
      setField('images', imgs);
    },
    [form.images, setField]
  );

  const addImageSlot = useCallback(
    () => setField('images', [...form.images, '']),
    [form.images, setField]
  );

  const removeImageSlot = useCallback(
    (i: number) => setField('images', form.images.filter((_, idx) => idx !== i)),
    [form.images, setField]
  );

  // ── Handlers de imágenes via API (modo edición) ──────────────────────────
  const handleApiUploadImage = useCallback(async () => {
    setImgError('');
    if (!imgFile) { setImgError('Seleccioná un archivo'); return; }
    if (!productId) return;
    try {
      await uploadImage(productId, imgFile, imgNewAlt.trim() || undefined);
      setImgFile(null);
      setImgNewAlt('');
      setShowAddImgForm(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // error guardado en contexto
    }
  }, [imgFile, imgNewAlt, productId, uploadImage]);

  const handleApiStartEdit = useCallback((img: ProductImageItem) => {
    setEditingImgId(img.id);
    setEditingImgAlt(img.altText ?? '');
  }, []);

  const handleApiCommitEdit = useCallback(
    async (imageId: string) => {
      if (!productId) return;
      setSavingImgId(imageId);
      try {
        await updateImageMeta(productId, imageId, { altText: editingImgAlt.trim() || null });
        setEditingImgId(null);
      } catch {
        // error en contexto
      } finally {
        setSavingImgId(null);
      }
    },
    [productId, editingImgAlt, updateImageMeta]
  );

  const handleApiDeleteImage = useCallback(
    async (imageId: string) => {
      if (!productId || !window.confirm('¿Eliminar esta imagen?')) return;
      setDeletingImgId(imageId);
      try {
        await deleteImage(productId, imageId);
        logAdminActivity({
          timestamp: new Date().toISOString(),
          user: userEmail,
          action: 'delete',
          entity: 'product-image',
          entityId: imageId,
          details: { productId },
        });
      } catch {
        // error en contexto
      } finally {
        setDeletingImgId(null);
      }
    },
    [productId, userEmail, deleteImage]
  );

  // ── Handlers de categoría ────────────────────────────────────────────────
  const getCategoryLabel = useCallback(
    (category: { id: string; name: string; parentId?: string | null }) => {
      if (!category.parentId) return category.name;
      const parent = categories.find(item => item.id === category.parentId);
      return parent ? `${parent.name} > ${category.name}` : category.name;
    },
    [categories]
  );

  const handlePrimaryCategoryChange = useCallback(
    (value: string) => {
      if (!value) {
        setForm(prev => ({
          ...prev,
          category: { id: '', name: '', slug: '', isVisible: true },
          categoryIds: [],
        }));
        return;
      }
      const category = categories.find(item => item.id === value);
      if (!category) return;
      setForm(prev => {
        const existing = Array.isArray(prev.categoryIds)
          ? prev.categoryIds.filter(id => id !== prev.category.id)
          : [];
        const nextIds = [category.id, ...existing.filter(id => id !== category.id)];
        return { ...prev, category, categoryIds: nextIds };
      });
    },
    [categories]
  );

  const handleAdditionalCategoriesChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = Array.from(event.target.selectedOptions).map(o => o.value);
      setForm(prev => {
        const primaryId = prev.category.id;
        const nextIds = primaryId
          ? [primaryId, ...selected.filter(id => id !== primaryId)]
          : selected;
        return { ...prev, categoryIds: nextIds };
      });
    },
    []
  );

  const additionalCategoryIds = Array.isArray(form.categoryIds)
    ? form.categoryIds.filter(id => id !== form.category.id)
    : [];

  // ── Derivar errores por tab ──────────────────────────────────────────────
  const tabBasicoHasError = !!fieldErrors.name;
  const tabPreciosHasError = !!(
    fieldErrors.price ||
    fieldErrors.discount ||
    fieldErrors.originalPrice ||
    fieldErrors.stock
  );
  const tabCategoriasHasError = !!fieldErrors.category;
  const tabImagenesHasError = !!fieldErrors.images;

  const tabs: TabDefinition[] = [
    { id: 'basico', label: 'Básico', icon: '📝', hasError: tabBasicoHasError },
    { id: 'precios', label: 'Precios', icon: '💰', hasError: tabPreciosHasError },
    { id: 'categorias', label: 'Categorías', icon: '🗂️', hasError: tabCategoriasHasError },
    { id: 'imagenes', label: 'Imágenes', icon: '🖼️', hasError: tabImagenesHasError },
    { id: 'variantes', label: 'Variantes', icon: '🔄' },
    { id: 'seo', label: 'SEO / Publicación', icon: '🌐' },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      disableClose={saving}
      size="lg"
      layout="flush"
      className={`${styles.panel} dark:bg-gray-800 dark:text-gray-100`}
      ariaLabelledBy="admin-product-form-title"
    >
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle} id="admin-product-form-title">
          {isEdit ? 'Editar producto' : 'Nuevo producto'}
        </h2>
        <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Cerrar">
          ✕
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TabsWrapper tabs={tabs} defaultTab="basico" className={styles.tabsWrapper}>

          <TabBasico
            form={form}
            fieldErrors={fieldErrors}
            isEdit={isEdit}
            setField={setField}
            tagInput={tagInput}
            setTagInput={setTagInput}
            featureInput={featureInput}
            setFeatureInput={setFeatureInput}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onAddFeature={addFeature}
            onRemoveFeature={removeFeature}
          />

          <TabPreciosInventario
            form={form}
            fieldErrors={fieldErrors}
            isEdit={isEdit}
            setField={setField}
          />

          <TabCategorias
            form={form}
            fieldErrors={fieldErrors}
            isEdit={isEdit}
            setField={setField}
            categories={categories}
            additionalCategoryIds={additionalCategoryIds}
            onPrimaryCategoryChange={handlePrimaryCategoryChange}
            onAdditionalCategoriesChange={handleAdditionalCategoriesChange}
            getCategoryLabel={getCategoryLabel}
          />

          <TabImagenes
            isEdit={isEdit}
            productId={productId}
            images={form.images}
            fieldErrors={fieldErrors}
            onSetImage={setImage}
            onAddImageSlot={addImageSlot}
            onRemoveImageSlot={removeImageSlot}
            apiImages={apiImages}
            imagesLoading={imagesLoading}
            imagesError={imagesError}
            imgFile={imgFile}
            setImgFile={setImgFile}
            imgNewAlt={imgNewAlt}
            setImgNewAlt={setImgNewAlt}
            imgError={imgError}
            showAddImgForm={showAddImgForm}
            setShowAddImgForm={setShowAddImgForm}
            editingImgId={editingImgId}
            setEditingImgId={setEditingImgId}
            editingImgAlt={editingImgAlt}
            setEditingImgAlt={setEditingImgAlt}
            savingImgId={savingImgId}
            deletingImgId={deletingImgId}
            fileInputRef={fileInputRef}
            onApiUploadImage={handleApiUploadImage}
            onApiStartEdit={handleApiStartEdit}
            onApiCommitEdit={handleApiCommitEdit}
            onApiDeleteImage={handleApiDeleteImage}
          />


          <TabVariantes
            form={form}
            fieldErrors={fieldErrors}
            isEdit={isEdit}
            setField={setField}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            newGroupValues={newGroupValues}
            setNewGroupValues={setNewGroupValues}
            onAddVariantGroup={addVariantGroup}
            onRemoveVariantGroup={removeVariantGroup}
            onAddVariantValue={addVariantValue}
            onRemoveVariantValue={removeVariantValue}
          />

          <TabSEOPublicacion
            form={form}
            fieldErrors={fieldErrors}
            isEdit={isEdit}
            setField={setField}
          />

        </TabsWrapper>

        {error && (
          <div className={styles.error} aria-live="polite">
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}