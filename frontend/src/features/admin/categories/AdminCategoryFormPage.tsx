import { useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useBlocker } from 'react-router-dom';
import type { Category } from '../../../types';
import { useCategoryForm } from '../../../hooks/useCategoryFormPage';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { CategoryTabBasico } from './tabs/CategoryTabBasico';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';

import styles from './AdminCategoryFormPage.module.css';

interface Props {
    categoryId: string | null;
    onBack: () => void;
    onSuccess: () => void;
    onUnsavedChanges?: (unsaved: boolean) => void;
}

export function AdminCategoryFormPage({
    categoryId,
    onBack,
    onSuccess,
    onUnsavedChanges,
}: Props) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const formProps = useCategoryForm({
        categoryId,
        onSuccess,
        onUnsavedChanges,
    });

    const { categories } = useAdminCategories();
    const parentCategories = useMemo(
        () => categories.filter(c => c.id !== categoryId),
        [categories, categoryId]
    );

    const shallowCompareRelevantFields = useCallback(
        (a: Omit<Category, 'id'>, b: Omit<Category, 'id'>): boolean => {
            const keys: (keyof Omit<Category, 'id'>)[] = [
                'name', 'slug', 'description', 'image', 'parentId', 'isVisible',
            ];
            for (const key of keys) {
                if (a[key] !== b[key]) return false;
            }
            return true;
        },
        []
    );

    const isDirty = useMemo(
        () =>
            !shallowCompareRelevantFields(formProps.form, formProps.initialForm) ||
            !!formProps.imgFile,
        [formProps.form, formProps.initialForm, formProps.imgFile, shallowCompareRelevantFields]
    );

    const blocker = useBlocker(isDirty);

    const handleCancel = useCallback(() => {
        onBack();
    }, [onBack]);

    const { saving, error, isEdit, loading } = formProps;

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Cargando categoría...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header de la página fijo y opaco */}
            <header className={styles.pageHeader}>
                <div className={styles.pageHeaderInner}>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className={styles.backBtn}
                        aria-label="Volver al listado"
                    >
                        <ArrowLeft size={16} />
                        Categorías
                    </button>
                    <h1 className={styles.pageTitle}>
                        {isEdit ? 'Editar categoría' : 'Nueva categoría'}
                    </h1>
                </div>
                <div className={styles.pageHeaderActions}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={handleCancel}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={styles.submitBtn}
                        disabled={saving}
                        onClick={() => formRef.current?.requestSubmit()}
                    >
                        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
                    </button>
                </div>
            </header>

            <form
                ref={formRef}
                className={styles.formContent}
                onSubmit={formProps.handleSubmit}
                noValidate
            >
                {/* ── Tarjeta 1: Información Básica ── */}
                <section className={styles.cardSection}>
                    <h2 className={styles.cardSectionTitle}>
                        <i className="bi bi-file-earmark-text" /> Información Básica
                    </h2>
                    <CategoryTabBasico
                        form={formProps.form}
                        errors={formProps.fieldErrors}
                        setField={formProps.setField}
                        parentCategories={parentCategories}
                    />
                </section>

                {/* ── Tarjeta 2: Imagen de Categoría ── */}
                <section className={styles.cardSection}>
                    <h2 className={styles.cardSectionTitle}>
                        <i className="bi bi-image" /> Imagen de Categoría
                    </h2>
                    <p className={styles.fieldHint}>
                        Subí una imagen representativa para la categoría (formatos recomendados: JPG, PNG, WebP).
                    </p>

                    {(formProps.fieldErrors.image || formProps.imgError) && (
                        <div className={styles.imgError}>
                            {formProps.fieldErrors.image || formProps.imgError}
                        </div>
                    )}

                    {formProps.form.image && !formProps.imgFile && (
                        <div className={styles.imagePreview}>
                            <img
                                src={formProps.form.image}
                                alt="Imagen actual"
                                className={styles.imagePreviewImg}
                            />
                            <div className={styles.imagePreviewInfo}>
                                <span className={styles.imagePreviewLabel}>Imagen actual</span>
                                <button
                                    type="button"
                                    onClick={formProps.handleDeleteImage}
                                    className={styles.deleteImageBtn}
                                    title="Eliminar imagen"
                                    aria-label="Eliminar imagen actual"
                                >
                                    <X size={16} /> Eliminar
                                </button>
                            </div>
                        </div>
                    )}

                    {formProps.imgFile && (
                        <div className={styles.imagePreview}>
                            <img
                                src={URL.createObjectURL(formProps.imgFile)}
                                alt="Nueva imagen"
                                className={styles.imagePreviewImg}
                            />
                            <div className={styles.imagePreviewInfo}>
                                <span className={styles.imagePreviewLabel}>Nueva imagen a cargar</span>
                                <button
                                    type="button"
                                    onClick={formProps.handleDeleteImage}
                                    className={styles.deleteImageBtn}
                                    title="Eliminar imagen"
                                    aria-label="Eliminar nueva imagen"
                                >
                                    <X size={16} /> Eliminar
                                </button>
                            </div>
                        </div>
                    )}

                    {!formProps.form.image && !formProps.imgFile && (
                        <div className={styles.imageUploadSection}>
                            <label className={styles.imageUploadTrigger}>
                                <Upload size={24} />
                                <span>Tocá para seleccionar una imagen</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={formProps.handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    )}
                </section>

                {error && (
                    <div className={styles.globalError} role="alert">
                        {error}
                    </div>
                )}
            </form>

            {/* Barra fija de acciones para móvil (<768px) */}
            <div className={styles.fixedBottomBarMobile}>
                <button
                    type="button"
                    className={styles.submitBtn}
                    disabled={saving}
                    onClick={() => formRef.current?.requestSubmit()}
                >
                    {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
                </button>
                <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={handleCancel}
                    disabled={saving}
                >
                    Cancelar
                </button>
            </div>

            {/* Modal de confirmación de cambios no guardados */}
            <ModalConfirm
                open={blocker.state === 'blocked'}
                title="¿Abandonar sin guardar?"
                description="Tenés cambios sin guardar. ¿Estás seguro de que querés abandonar?"
                confirmText="Sí, abandonar"
                cancelText="Seguir editando"
                onConfirm={() => blocker.proceed?.()}
                onCancel={() => blocker.reset?.()}
            />
        </div>
    );
}