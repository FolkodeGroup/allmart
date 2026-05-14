import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { FileText, Image, ArrowLeft, AlertCircle, Upload } from 'lucide-react';
import { useBlocker } from 'react-router-dom';
import { useCategoryForm } from '../../../hooks/useCategoryFormPage';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
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

// ── Section definitions ────────────────────────────────────────────────────
const SECTIONS = [
    { id: 'basico', label: 'Básico', Icon: FileText },
    { id: 'imagenes', label: 'Imágenes', Icon: Image },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ── Component ──────────────────────────────────────────────────────────────
export function AdminCategoryFormPage({
    categoryId,
    onBack,
    onSuccess,
    onUnsavedChanges,
}: Props) {
    const formRef = React.useRef<HTMLFormElement | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Track which section is visible
    const [activeSection, setActiveSection] = React.useState<SectionId>('basico');
    const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
        basico: null,
        imagenes: null,
    });
    const observerRef = useRef<IntersectionObserver | null>(null);

    // All form state + handlers from hook
    const formProps = useCategoryForm({
        categoryId,
        onSuccess,
        onUnsavedChanges,
    });

    // Get parent categories (all categories except self and descendants)
    const { categories } = useAdminCategories();
    const parentCategories = useMemo(
        () => categories.filter(c => c.id !== categoryId),
        [categories, categoryId]
    );

    // Optimized isDirty comparison
    const shallowCompareRelevantFields = React.useCallback(
        (
            a: typeof formProps.form,
            b: typeof formProps.form
        ): boolean => {
            const keys: (keyof typeof formProps.form)[] = [
                'name',
                'slug',
                'description',
                'image',
                'parentId',
                'isVisible',
            ];
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
        },
        []
    );

    const isDirty = useMemo(
        () =>
            !shallowCompareRelevantFields(formProps.form, formProps.initialForm) ||
            !!formProps.imgFile,
        [formProps.form, formProps.initialForm, formProps.imgFile, shallowCompareRelevantFields]
    );

    const { showWarning, confirmNavigation, cancelNavigation, interceptNavigation, setIsDirty } =
        useUnsavedChangesWarning({
            active: isDirty,
            onConfirmExit: onBack,
        });

    // Sync external isDirty into the hook's internal state so interceptNavigation fires
    useEffect(() => {
        setIsDirty(isDirty);
    }, [isDirty, setIsDirty]);

    // Block in-app SPA navigation when there are unsaved changes
    const blocker = useBlocker(isDirty);

    const handleCancel = useCallback(() => {
        interceptNavigation(() => {
            onBack();
        });
    }, [interceptNavigation, onBack]);

    // ── Scroll spy via IntersectionObserver ───────────────────────────────
    useEffect(() => {
        observerRef.current?.disconnect();
        observerRef.current = new IntersectionObserver(
            entries => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    setActiveSection(visible[0].target.id as SectionId);
                }
            },
            { threshold: 0.3, rootMargin: '-60px 0px -60% 0px' }
        );

        SECTIONS.forEach(s => {
            const el = sectionRefs.current[s.id];
            if (el) observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, []);

    const scrollToSection = useCallback((id: SectionId) => {
        setActiveSection(id); // Resalta la tab al hacer click
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const setSectionRef = useCallback(
        (id: SectionId) => (el: HTMLElement | null) => {
            sectionRefs.current[id] = el;
        },
        []
    );

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
            {/* ── Page header ──────────────────────────────────────────────── */}
            <header className={styles.pageHeader}>
                <div className={styles.pageHeaderInner}>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className={styles.backBtn}
                        aria-label="Volver al listado"
                    >
                        <ArrowLeft size={14} />
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

            <div className={styles.layout}>
                {/* ── Sticky sidebar nav ───────────────────────────────────── */}
                <nav className={styles.sidebar} aria-label="Secciones del formulario">
                    <ul className={styles.sidebarList}>
                        {SECTIONS.map(section => {
                            const hasError = false; // TODO: Add error tracking if needed
                            return (
                                <li key={section.id}>
                                    <button
                                        type="button"
                                        className={`${styles.sidebarItem} ${
                                            activeSection === section.id ? styles.sidebarItemActive : ''
                                        }`}
                                        onClick={() => scrollToSection(section.id)}
                                    >
                                        <section.Icon
                                            size={15}
                                            className={styles.sidebarIcon}
                                            strokeWidth={activeSection === section.id ? 2.5 : 1.8}
                                        />
                                        <span className={styles.sidebarLabel}>{section.label}</span>
                                        {hasError && (
                                            <AlertCircle
                                                size={13}
                                                className={styles.errorDotIcon}
                                                aria-label="Sección con errores"
                                            />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Progress indicator */}
                    <div className={styles.sidebarProgress}>
                        <div
                            className={styles.sidebarProgressBar}
                            style={{
                                height: `${
                                    ((SECTIONS.findIndex(s => s.id === activeSection) + 1) /
                                        SECTIONS.length) *
                                    100
                                }%`,
                            }}
                        />
                    </div>
                </nav>

                {/* ── Scrollable form content ──────────────────────────────── */}
                <form
                    ref={formRef}
                    className={styles.content}
                    onSubmit={formProps.handleSubmit}
                    noValidate
                >
                    {/* ── Básico ─────────────────────────────────────────────── */}
                    <section id="basico" ref={setSectionRef('basico')} className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <FileText size={17} strokeWidth={1.8} /> Información básica
                        </h2>
                        <CategoryTabBasico
                            form={formProps.form}
                            errors={formProps.fieldErrors}
                            setField={formProps.setField}
                            parentCategories={parentCategories}
                        />
                    </section>

                    {/* ── Imágenes ───────────────────────────────────────────── */}
                    <section
                        id="imagenes"
                        ref={setSectionRef('imagenes')}
                        className={styles.section}
                    >
                        <h2 className={styles.sectionTitle}>
                            <Image size={17} strokeWidth={1.8} /> Imagen
                        </h2>
                        <fieldset className={styles.fieldset}>
                            <legend className={styles.legend}>Imagen de la categoría *</legend>

                            {(formProps.fieldErrors.image || formProps.imgError) && (
                                <div className={styles.imgError}>
                                    {formProps.fieldErrors.image || formProps.imgError}
                                </div>
                            )}

                            {formProps.form.image && !formProps.imgFile && (
                                <div className={styles.imagePreview}>
                                    <img
                                        src={formProps.form.image}
                                        alt="Preview"
                                        className={styles.imagePreviewImg}
                                    />
                                    <span className={styles.fieldHint}>Imagen actual</span>
                                </div>
                            )}

                            {formProps.imgFile && (
                                <div className={styles.imagePreview}>
                                    <img
                                        src={URL.createObjectURL(formProps.imgFile)}
                                        alt="Preview"
                                        className={styles.imagePreviewImg}
                                    />
                                    <span className={styles.fieldHint}>Nueva imagen a cargar</span>
                                </div>
                            )}

                            <div className={styles.imageUploadSection}>
                                <label className={styles.imageUploadTrigger}>
                                    <Upload size={24} />
                                    <span>Click para seleccionar o arrastra una imagen</span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={formProps.handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {formProps.imgFile && (
                                    <p className={styles.fieldHint}>
                                        Archivo: {formProps.imgFile.name} (
                                        {(formProps.imgFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>
                        </fieldset>
                    </section>

                    {/* ── Global error ───────────────────────────────────────── */}
                    {error && (
                        <div className={styles.globalError} role="alert">
                            {error}
                        </div>
                    )}
                </form>
            </div>

            {/* ── Unsaved changes warning (cancel button or SPA navigation) ─── */}
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
}
