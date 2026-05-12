import { useState, useEffect, useCallback } from 'react';
import type { Category } from '../types';
import { useAdminCategories } from '../context/AdminCategoriesContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { sanitizeObject } from '../utils/security';
import { logAdminActivity } from '../services/adminActivityLogService';

export const EMPTY_CATEGORY_FORM: Omit<Category, 'id'> = {
    name: '',
    slug: '',
    description: '',
    image: '',
    parentId: null,
    isVisible: true,
    itemCount: 0,
};

export interface UseCategoryFormOptions {
    categoryId?: string | null;
    onSuccess: () => void;
    onUnsavedChanges?: (unsaved: boolean) => void;
}

export function useCategoryForm({ categoryId, onSuccess, onUnsavedChanges }: UseCategoryFormOptions) {
    const auth = useAdminAuth();
    const userEmail = (auth.user as { email?: string } | null)?.email ?? 'desconocido';

    const { addCategory, updateCategory, getCategory, categories, uploadCategoryImage } = useAdminCategories();

    const isEdit = !!categoryId;

    // ── Core form state ────────────────────────────────────────────────────
    const [form, setForm] = useState<Omit<Category, 'id'>>(EMPTY_CATEGORY_FORM);
    const [initialForm, setInitialForm] = useState<Omit<Category, 'id'>>(EMPTY_CATEGORY_FORM);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    // ── Image management state ─────────────────────────────────────────────
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [imgError, setImgError] = useState('');

    // ── Initialize form when categoryId changes ────────────────────────────
    useEffect(() => {
        const initForm = async () => {
            setLoading(true);
            if (categoryId) {
                const c = getCategory(categoryId);
                if (c) {
                    const { id: _id, ...rest } = c;
                    void _id;
                    const loadedForm = {
                        ...rest,
                        itemCount: rest.itemCount ?? 0,
                    };
                    setForm(loadedForm);
                    setInitialForm(loadedForm);
                }
            } else {
                setForm(EMPTY_CATEGORY_FORM);
                setInitialForm(EMPTY_CATEGORY_FORM);
            }
            setError('');
            setFieldErrors({});
            setImgFile(null);
            setImgError('');
            setLoading(false);
        };
        initForm();
    }, [categoryId, getCategory]);

    // ── Optimized isDirty comparison ───────────────────────────────────────
    const shallowCompareRelevantFields = useCallback((a: typeof form, b: typeof form): boolean => {
        const keys: (keyof typeof form)[] = ['name', 'slug', 'description', 'image', 'parentId', 'isVisible'];
        for (const key of keys) {
            const valA = a[key];
            const valB = b[key];
            if (typeof valA === 'object' && valA && valB) {
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
    const setField = useCallback(<K extends keyof Omit<Category, 'id'>>(
        key: K,
        value: Omit<Category, 'id'>[K]
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
    const validateForm = useCallback((): boolean => {
        const errors: Record<string, string> = {};
        if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
        if (!form.slug.trim()) errors.slug = 'El slug es obligatorio';

        // Validar que haya imagen (nueva o existente)
        if (!form.image && !imgFile) {
            errors.image = 'Es obligatorio subir al menos una imagen para la categoría';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [form, imgFile]);

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!validateForm()) return;

        setError('');
        setSaving(true);
        const sanitizedForm = sanitizeObject(form);

        try {
            let categoryId_result: string | undefined;

            if (isEdit && categoryId) {
                const { itemCount: _omitted, ...formWithoutItemCount } = sanitizedForm;
                void _omitted;
                await updateCategory(categoryId, formWithoutItemCount as Partial<Category>);
                categoryId_result = categoryId;
                logAdminActivity({
                    timestamp: new Date().toISOString(),
                    user: userEmail,
                    action: 'edit',
                    entity: 'category',
                    entityId: categoryId,
                    details: { ...formWithoutItemCount },
                });
            } else {
                const created = await addCategory(sanitizedForm) as Category;
                categoryId_result = created?.id;
                logAdminActivity({
                    timestamp: new Date().toISOString(),
                    user: userEmail,
                    action: 'create',
                    entity: 'category',
                    entityId: created?.id,
                    details: { ...sanitizedForm },
                });
            }

            // Upload image if selected
            if (imgFile && categoryId_result) {
                try {
                    await uploadCategoryImage(categoryId_result, imgFile);
                } catch (err) {
                    console.error('Error uploading image:', err);
                    // Continue anyway, category was saved
                }
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar la categoría');
        } finally {
            setSaving(false);
        }
    }, [form, isEdit, categoryId, validateForm, addCategory, updateCategory, uploadCategoryImage, userEmail, onSuccess, imgFile]);

    // ── Image handlers ────────────────────────────────────────────────────
    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImgError('');

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            setImgError('Por favor selecciona un archivo de imagen válido');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            setImgError('La imagen no debe pesar más de 5MB');
            return;
        }

        setImgFile(file);
    }, []);

    return {
        form,
        initialForm,
        setField,
        error,
        fieldErrors,
        saving,
        loading,
        isEdit,
        handleSubmit,
        imgFile,
        setImgFile,
        imgError,
        setImgError,
        handleImageChange,
        categories,
    };
}
