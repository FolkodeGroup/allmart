// src/features/admin/products/hooks/useProductForm.ts
//
// Extracted from AdminProductForm to decouple form logic from UI.
// This is the PRIMARY fix for the input-focus bug: by living in a stable
// hook (not recreated on tab switch), all callbacks keep the same reference
// across renders, preventing unnecessary child remounts.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { VariantGroup } from '../context/AdminProductsContext';
import type { AdminProduct } from '../context/AdminProductsContext';
import type { ProductImageItem } from '../context/AdminImagesContext';
import { useAdminProducts } from '../context/useAdminProductsContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminCategories } from '../context/AdminCategoriesContext';
import { useAdminImages } from '../context/AdminImagesContext';
import { useProductDefaults } from '../hooks/useProductDefaults';
import { sanitizeObject } from '../utils/security';
import { logAdminActivity } from '../services/adminActivityLogService';

export const EMPTY_FORM: Omit<AdminProduct, 'id'> = {
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

export interface UseProductFormOptions {
    productId?: string | null;
    onSuccess: () => void;
    onUnsavedChanges?: (unsaved: boolean) => void;
}

export function useProductForm({ productId, onSuccess, onUnsavedChanges }: UseProductFormOptions) {
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
    const { getMostRecentDefaults, setDefaults: setProductDefaults } = useProductDefaults();

    const isEdit = !!productId;

    // ── Core form state ────────────────────────────────────────────────────
    const [form, setForm] = useState<Omit<AdminProduct, 'id'>>(EMPTY_FORM);
    const [initialForm, setInitialForm] = useState<Omit<AdminProduct, 'id'>>(EMPTY_FORM);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    // ── Auxiliary input state ──────────────────────────────────────────────
    const [tagInput, setTagInput] = useState('');
    const [featureInput, setFeatureInput] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupValues, setNewGroupValues] = useState<Record<string, string>>({});

    // ── Image management state (edit mode only) ────────────────────────────
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [imgNewAlt, setImgNewAlt] = useState('');
    const [imgError, setImgError] = useState('');
    const [showAddImgForm, setShowAddImgForm] = useState(false);
    const [editingImgId, setEditingImgId] = useState<string | null>(null);
    const [editingImgAlt, setEditingImgAlt] = useState('');
    const [savingImgId, setSavingImgId] = useState<string | null>(null);
    const [deletingImgId, setDeletingImgId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // ── Initialise form when productId changes ─────────────────────────────
    useEffect(() => {
        const initForm = async () => {
            setLoading(true);
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
                const newForm = { ...EMPTY_FORM };
                const recentDefaults = getMostRecentDefaults();
                if (recentDefaults) {
                    newForm.stock = recentDefaults.stock;
                    newForm.inStock = recentDefaults.visible;
                }
                setForm(newForm);
                setInitialForm(newForm);
                clearImages();
            }
            setError('');
            setFieldErrors({});
            setLoading(false);
        };
        initForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);


    // ── Optimized isDirty comparison ───────────────────────────────────────
    const shallowCompareRelevantFields = useCallback((a: typeof form, b: typeof form): boolean => {
        // Solo comparar campos relevantes para el usuario final
        const keys: (keyof typeof form)[] = [
            'name', 'slug', 'description', 'shortDescription', 'price', 'originalPrice', 'discount',
            'images', 'category', 'categoryIds', 'tags', 'inStock', 'isFeatured', 'sku', 'features', 'stock', 'variants'
        ];
        for (const key of keys) {
            const valA = a[key];
            const valB = b[key];
            if (Array.isArray(valA) && Array.isArray(valB)) {
                if (valA.length !== valB.length || valA.some((v, i) => v !== valB[i])) return false;
            } else if (typeof valA === 'object' && valA && valB) {
                if (JSON.stringify(valA) !== JSON.stringify(valB)) return false;
            } else if (valA !== valB) {
                return false;
            }
        }
        return true;
    }, []);

    useEffect(() => {
        const isChanged = !shallowCompareRelevantFields(form, initialForm);
        if (onUnsavedChanges) onUnsavedChanges(isChanged);
    }, [form, initialForm, onUnsavedChanges, shallowCompareRelevantFields]);

    // ── Stable field setter — KEY FIX for focus bug ────────────────────────
    // Using useCallback with no deps on `form` prevents reference churn;
    // child inputs receive the same function reference each render.
    const setField = useCallback(<K extends keyof Omit<AdminProduct, 'id'>>(
        key: K,
        value: Omit<AdminProduct, 'id'>[K]
    ) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setFieldErrors(prev => {
            if (!prev[key as string]) return prev;
            const next = { ...prev };
            delete next[key as string];
            return next;
        });
    }, []); // stable reference — no deps needed because setForm is stable

    // ── Validation ─────────────────────────────────────────────────────────
    const validateForm = useCallback((): boolean => {
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
        if (form.stock < 0) errors.stock = 'El stock no puede ser negativo';
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
    }, [form, isEdit]);

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!validateForm()) return;

        setError('');
        setSaving(true);
        const sanitizedForm = sanitizeObject(form);

        try {
            if (form.category?.id) {
                setProductDefaults(form.category.id, {
                    stock: form.stock,
                    visible: form.inStock,
                    currency: 'ARS',
                });
            }

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
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar el producto');
        } finally {
            setSaving(false);
        }
    }, [form, isEdit, productId, validateForm, addProduct, updateProduct, userEmail, onSuccess, setProductDefaults]);

    // ── Tag handlers ───────────────────────────────────────────────────────
    const addTag = useCallback(() => {
        const t = tagInput.trim();
        if (t && !form.tags.includes(t)) setField('tags', [...form.tags, t]);
        setTagInput('');
    }, [tagInput, form.tags, setField]);

    const removeTag = useCallback(
        (tag: string) => setField('tags', form.tags.filter(t => t !== tag)),
        [form.tags, setField]
    );

    // ── Feature handlers ───────────────────────────────────────────────────
    const addFeature = useCallback(() => {
        const f = featureInput.trim();
        if (f) setField('features', [...(form.features ?? []), f]);
        setFeatureInput('');
    }, [featureInput, form.features, setField]);

    const removeFeature = useCallback(
        (i: number) => setField('features', (form.features ?? []).filter((_, idx) => idx !== i)),
        [form.features, setField]
    );

    // ── Variant handlers ───────────────────────────────────────────────────
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

    // ── Image handlers (URL / creation mode) ──────────────────────────────
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

    // ── Image handlers (API / edit mode) ──────────────────────────────────
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
            setImgError('Error al subir la imagen');
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
                // error surfaced via context
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
                // error surfaced via context
            } finally {
                setDeletingImgId(null);
            }
        },
        [productId, userEmail, deleteImage]
    );

    // ── Category handlers ──────────────────────────────────────────────────
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

    const additionalCategoryIds = useMemo(
        () => Array.isArray(form.categoryIds)
            ? form.categoryIds.filter(id => id !== form.category.id)
            : [],
        [form.categoryIds, form.category.id]
    );

    // ── Derived error flags per section ───────────────────────────────────
    const sectionErrors = useMemo(() => ({
        basic: !!fieldErrors.name,
        pricing: !!(fieldErrors.price || fieldErrors.discount || fieldErrors.originalPrice || fieldErrors.stock),
        categories: !!fieldErrors.category,
        images: !!fieldErrors.images,
    }), [fieldErrors]);

    return {
        // Form state
        initialForm,
        form,
        fieldErrors,
        sectionErrors,
        error,
        saving,
        loading,
        isEdit,

        // Core setter
        setField,

        // Submit
        handleSubmit,

        // Tag state + handlers
        tagInput, setTagInput, addTag, removeTag,

        // Feature state + handlers
        featureInput, setFeatureInput, addFeature, removeFeature,

        // Variant state + handlers
        newGroupName, setNewGroupName,
        newGroupValues, setNewGroupValues,
        addVariantGroup, removeVariantGroup,
        addVariantValue, removeVariantValue,

        // Image (URL/creation) handlers
        setImage, addImageSlot, removeImageSlot,

        // Image (API/edit) state + handlers
        apiImages, imagesLoading, imagesError,
        imgFile, setImgFile,
        imgNewAlt, setImgNewAlt,
        imgError,
        showAddImgForm, setShowAddImgForm,
        editingImgId, setEditingImgId,
        editingImgAlt, setEditingImgAlt,
        savingImgId, deletingImgId,
        fileInputRef,
        handleApiUploadImage,
        handleApiStartEdit,
        handleApiCommitEdit,
        handleApiDeleteImage,

        // Category state + handlers
        categories,
        additionalCategoryIds,
        getCategoryLabel,
        handlePrimaryCategoryChange,
        handleAdditionalCategoriesChange,
    };
}