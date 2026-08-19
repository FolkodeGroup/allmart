import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { VariantGroup } from '../context/AdminProductsContext';
import type { AdminProduct } from '../context/AdminProductsContext';
import { useAdminProducts } from '../context/useAdminProductsContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminCategories } from '../context/AdminCategoriesContext';
import { useAdminImages } from '../context/AdminImagesContext';
import { useProductDefaults } from '../hooks/useProductDefaults';
import { sanitizeObject } from '../utils/security';
import { ApiError } from '../utils/apiErrorHandler';
import { isValidSlug, isValidSku, hasProductImages } from '../utils/productFormUtils';
import { getFirstErrorKey } from '../utils/productFormFocus';
import { logAdminActivity } from '../services/adminActivityLogService';

export const EMPTY_FORM: Omit<AdminProduct, 'id'> = {
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
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
    primarySupplierId: null,
};

export interface UseProductFormOptions {
    productId?: string | null;
    onSuccess: () => void;
    onUnsavedChanges?: (unsaved: boolean) => void;
    onValidationError?: (fieldKey?: string) => void;
}

export function useProductForm({ productId, onSuccess, onUnsavedChanges, onValidationError }: UseProductFormOptions) {
    const auth = useAdminAuth();
    const userEmail = (auth.user as { email?: string } | null)?.email ?? 'desconocido';

    const { addProduct, updateProduct, getProduct, loadProductVariants, refreshCurrentPage } = useAdminProducts();
    const { categories } = useAdminCategories();
    const {
        images: apiImages,
        isLoading: imagesLoading,
        error: imagesError,
        loadImages,
        uploadImage,
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
    const [deletingImgId, setDeletingImgId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // ── Initialise form when productId changes ─────────────────────────────
    useEffect(() => {
        const initForm = async () => {
            setLoading(true);
            try {
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
            } catch (err) {
                console.error('Error inicializando el formulario de productos:', err);
            } finally {
                setLoading(false);
            }
        };
        initForm();
    }, [productId, getProduct, loadProductVariants, loadImages, getMostRecentDefaults, clearImages]);

    // ── Optimized isDirty comparison ───────────────────────────────────────
    const shallowCompareRelevantFields = useCallback((a: typeof form, b: typeof form): boolean => {
        const keys: (keyof typeof form)[] = [
            'name', 'slug', 'description', 'shortDescription', 'price',
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

    // ── Stable field setter ────────────────────────────────────────────────
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
    }, []);

    // ── Validation ─────────────────────────────────────────────────────────
    const validateForm = useCallback((): Record<string, string> => {
        const errors: Record<string, string> = {};
        const hasVariantOptions = Array.isArray(form.variants) && form.variants.length > 0;
        const hasImages = isEdit ? (apiImages.length > 0 || hasProductImages(form.images)) : hasProductImages(form.images);

        if (!form.name.trim()) {
            errors.name = 'El nombre es obligatorio';
        }

        if (!form.sku?.trim()) {
            errors.sku = 'El SKU es obligatorio';
        } else if (!isValidSku(form.sku)) {
            errors.sku = 'El SKU debe contener solo letras mayúsculas, números y guiones';
        }

        if (!hasVariantOptions) {
            if (form.price === undefined || form.price === null) {
                errors.price = 'El precio es obligatorio';
            } else if (form.price <= 0) {
                errors.price = 'El precio debe ser mayor a 0';
            }
        }

        if (!form.category?.id) {
            errors.category = 'Seleccioná una categoría principal';
        }

        if (!hasImages) {
            errors.images = 'Debes agregar al menos una imagen del producto';
        }

        if (form.slug && !isValidSlug(form.slug)) {
            errors.slug = 'El slug debe contener solo letras minúsculas, números y guiones';
        }

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            onValidationError?.(getFirstErrorKey(errors));
        }
        return errors;
    }, [apiImages.length, form, isEdit, onValidationError]);

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (e?: React.FormEvent): Promise<boolean> => {
        e?.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) return false;

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

                try {
                    logAdminActivity({
                        timestamp: new Date().toISOString(),
                        user: userEmail,
                        action: 'edit',
                        entity: 'product',
                        entityId: productId,
                        details: { ...formWithoutImages },
                    });
                } catch (auditErr) {
                    console.warn('[Audit Log Warning] Registro de auditoría omitido de manera segura:', auditErr);
                }
            } else {
                const created = await addProduct(sanitizedForm) as AdminProduct;

                try {
                    logAdminActivity({
                        timestamp: new Date().toISOString(),
                        user: userEmail,
                        action: 'create',
                        entity: 'product',
                        entityId: created?.id,
                        details: { ...sanitizedForm },
                    });
                } catch (auditErr) {
                    console.warn('[Audit Log Warning] Registro de auditoría omitido de manera segura:', auditErr);
                }
            }
            onSuccess();
        } catch (err) {
            const message = err instanceof Error ? err.message : '';

            if (err instanceof ApiError) {
                const responseData = err.data as { errors?: unknown } | undefined;
                if (responseData?.errors && typeof responseData.errors === 'object' && !Array.isArray(responseData.errors)) {
                    const responseErrors = responseData.errors as Record<string, string>;
                    setFieldErrors(prev => ({
                        ...prev,
                        ...responseErrors,
                    }));
                    onValidationError?.(getFirstErrorKey(responseErrors));
                    return false;
                }
            }

            if (message.toLowerCase().includes('sku') || message.toLowerCase().includes('duplicate')) {
                const duplicateErrors = {
                    sku: 'Este SKU ya está en uso',
                };
                setFieldErrors(prev => ({
                    ...prev,
                    ...duplicateErrors,
                }));
                onValidationError?.(getFirstErrorKey(duplicateErrors));
                return false;
            }

            setError(message || 'Error al guardar el producto');
        } finally {
            setSaving(false);
        }

        return true;
    }, [form, isEdit, productId, validateForm, addProduct, updateProduct, userEmail, onSuccess, setProductDefaults, onValidationError]);

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
    const handleApiUploadImage = useCallback(async (fileOverride?: File) => {
        setImgError('');
        const file = fileOverride ?? imgFile;
        if (!file) { setImgError('Seleccioná un archivo'); return; }
        if (!productId) return;
        try {
            await uploadImage(productId, file, imgNewAlt.trim() || undefined);
            setImgFile(null);
            setImgNewAlt('');
            setShowAddImgForm(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            await refreshCurrentPage();
        } catch (err) {
            console.error('Error durante la subida de imagen:', err);
            setImgError('Error al subir la imagen');
        }
    }, [imgFile, imgNewAlt, productId, uploadImage, refreshCurrentPage]);

    const handleApiDeleteImage = useCallback(
        async (imageId: string) => {
            if (!productId) return;
            setDeletingImgId(imageId);
            try {
                await deleteImage(productId, imageId);

                try {
                    logAdminActivity({
                        timestamp: new Date().toISOString(),
                        user: userEmail,
                        action: 'delete',
                        entity: 'product-image',
                        entityId: imageId,
                        details: { productId },
                    });
                } catch (auditErr) {
                    console.warn('[Audit Log Warning] Registro de auditoría omitido de manera segura:', auditErr);
                }

                await refreshCurrentPage();
            } catch (err) {
                console.error('Error eliminando la imagen:', err);
            } finally {
                setDeletingImgId(null);
            }
        },
        [productId, userEmail, deleteImage, refreshCurrentPage]
    );

    // ── Category handlers con limpieza de subcategorías huérfanas ──────────
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

            // 🛡️ REGLA ARQUITECTÓNICA: Subcategorías válidas solo para el nuevo padre
            const validSubcategoryIds = new Set(
                categories.filter(c => c.parentId === category.id).map(c => c.id)
            );

            setForm(prev => {
                // Filtramos y eliminamos subcategorías que pertenecían al padre anterior
                const existingValidSubcats = Array.isArray(prev.categoryIds)
                    ? prev.categoryIds.filter(id => id !== prev.category.id && validSubcategoryIds.has(id))
                    : [];
                const nextIds = [category.id, ...existingValidSubcats];
                return { ...prev, category, categoryIds: nextIds };
            });
        },
        [categories]
    );

    const handleAdditionalCategoriesChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            const selected = Array.from(event.target.selectedOptions).map(o => o.value);
            setForm(prev => {
                const primaryId = prev.category?.id;
                if (!primaryId) {
                    return { ...prev, categoryIds: [] };
                }
                const nextIds = [primaryId, ...selected.filter(id => id !== primaryId)];
                return { ...prev, categoryIds: nextIds };
            });
        },
        []
    );

    const additionalCategoryIds = useMemo(
        () => Array.isArray(form.categoryIds)
            ? form.categoryIds.filter(id => id !== form.category?.id)
            : [],
        [form.categoryIds, form.category?.id]
    );

    // ── Derived error flags per section ───────────────────────────────────
    const sectionErrors = useMemo(() => ({
        basico: !!(fieldErrors.name || fieldErrors.sku || fieldErrors.slug),
        precios: !!(fieldErrors.price || fieldErrors.stock || fieldErrors.criticalStockThreshold),
        categorias: !!fieldErrors.category,
        imagenes: !!fieldErrors.images,
        variantes: !!fieldErrors.variants,
        seo: false,
    }), [fieldErrors]);

    return {
        initialForm,
        form,
        fieldErrors,
        sectionErrors,
        error,
        saving,
        loading,
        isEdit,
        setField,
        handleSubmit,
        tagInput, setTagInput, addTag, removeTag,
        featureInput, setFeatureInput, addFeature, removeFeature,
        newGroupName, setNewGroupName,
        newGroupValues, setNewGroupValues,
        addVariantGroup, removeVariantGroup,
        addVariantValue, removeVariantValue,
        setImage, addImageSlot, removeImageSlot,
        apiImages, imagesLoading, imagesError,
        imgFile, setImgFile,
        imgNewAlt, setImgNewAlt,
        imgError,
        showAddImgForm, setShowAddImgForm,
        deletingImgId,
        fileInputRef,
        handleApiUploadImage,
        handleApiDeleteImage,
        categories,
        additionalCategoryIds,
        getCategoryLabel,
        handlePrimaryCategoryChange,
        handleAdditionalCategoriesChange,
    };
}