import React, { useCallback, useEffect, useRef, useMemo } from 'react';
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

// ── Definiciones de secciones ──────────────────────────────────────────────
const SECTIONS = [
    { id: 'basico', label: 'Básico', Icon: 'bi bi-file-earmark-text' },
    { id: 'imagenes', label: 'Imágenes', Icon: 'bi bi-image' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];
type CategoryFormState = Omit<Category, 'id'>;

// ── Componente principal ───────────────────────────────────────────────────
export function AdminCategoryFormPage({
    categoryId,
    onBack,
    onSuccess,
    onUnsavedChanges,
}: Props) {
    const formRef = React.useRef<HTMLFormElement | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Estado para controlar qué sección está activa en la barra lateral de Escritorio
    const [activeSection, setActiveSection] = React.useState<SectionId>('basico');

    // MOBILE-FIRST: Acordeones para pantalla táctil
    const [accordionsOpen, setAccordionsOpen] = React.useState<Record<SectionId, boolean>>({
        basico: true,
        imagenes: true,
    });

    const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
        basico: null,
        imagenes: null,
    });
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Hooks y estado del formulario
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

    const isActive = (sectionId: SectionId) => activeSection === sectionId;

    const shallowCompareRelevantFields = useCallback(
        (a: CategoryFormState, b: CategoryFormState): boolean => {
            const keys: (keyof CategoryFormState)[] = [
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

    // Bloqueo de navegación SPA en caso de cambios no guardados
    const blocker = useBlocker(isDirty);

    const handleCancel = useCallback(() => {
        onBack();
    }, [onBack]);

    const toggleAccordion = useCallback((id: SectionId) => {
        setAccordionsOpen(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // ── Scroll spy para escritorio ──────────────────────────────────────────
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
        setActiveSection(id);
        setAccordionsOpen(prev => ({ ...prev, [id]: true }));
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
            <style>{`
                @media (max-width: 767px) {
                    .desktopSidebarOnly {
                        display: none !important;
                    }
                    .stickyFormHeaderMobile {
                        position: relative !important;
                        top: auto !important;
                        z-index: 10 !important;
                        background: transparent !important;
                        border-bottom: 1px solid var(--color-border, rgba(229, 226, 221, 0.15)) !important;
                        padding: 8px 4px 12px 4px !important;
                        margin: 0 0 12px 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    .mobileSectionCard {
                        width: 100% !important;
                        box-sizing: border-box !important;
                        border-radius: 12px !important;
                        border: 1px solid var(--color-border, #374151) !important;
                        background: var(--color-bg-secondary, #28353d) !important;
                        overflow: hidden !important;
                        margin-bottom: 12px !important;
                    }
                    .accordionHeaderButton {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        padding: 14px 16px !important;
                        background: var(--color-bg-secondary, #28353d) !important;
                        border: none !important;
                        color: var(--color-text-primary, #ffffff) !important;
                        font-size: 15px !important;
                        font-weight: 700 !important;
                        cursor: pointer !important;
                        min-height: 48px !important;
                        text-align: left !important;
                    }
                    .accordionBodyMobile {
                        width: 100% !important;
                        box-sizing: border-box !important;
                        padding: 12px 14px 16px 14px !important;
                        border-top: 1px solid var(--color-border, #374151) !important;
                    }
                    .accordionBodyHidden {
                        display: none !important;
                    }
                    .fixedBottomBarMobile {
                        position: fixed !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        z-index: 99999 !important;
                        background: var(--color-bg-primary, #111827) !important;
                        border-top: 1px solid var(--color-border, #374151) !important;
                        padding: 12px 16px calc(12px + env(safe-area-inset-bottom)) 16px !important;
                        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3) !important;
                        display: flex !important;
                        gap: 10px !important;
                    }
                    .fixedBottomBarMobile button {
                        flex: 1 !important;
                        min-height: 48px !important;
                        font-size: 15px !important;
                        font-weight: 700 !important;
                        border-radius: 10px !important;
                    }
                }

                @media (min-width: 768px) {
                    .accordionHeaderButton {
                        display: none !important;
                    }
                    .accordionBodyHidden {
                        display: block !important;
                    }
                    .fixedBottomBarMobile {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Header de la página */}
            <header className={`${styles.pageHeader} stickyFormHeaderMobile`}>
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
                {/* Navegación lateral activa SOLO en Escritorio */}
                <nav className={`${styles.sidebar} desktopSidebarOnly`} aria-label="Secciones del formulario">
                    <ul className={styles.sidebarList}>
                        {SECTIONS.map(section => {
                            return (
                                <li key={section.id}>
                                    <button
                                        type="button"
                                        className={`${styles.sidebarItem} ${
                                            activeSection === section.id ? styles.sidebarItemActive : ''
                                        }`}
                                        onClick={() => scrollToSection(section.id)}
                                    >
                                        <i
                                            className={section.Icon}
                                            style={{
                                                color: isActive(section.id) ? 'white' : 'var(--color-primary)',
                                                fontSize: '1.1rem',
                                            }}
                                        />
                                        <span className={styles.sidebarLabel}>{section.label}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

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

                {/* Formulario principal */}
                <form
                    ref={formRef}
                    className={styles.content}
                    onSubmit={formProps.handleSubmit}
                    noValidate
                >
                    {/* ── Básico ── */}
                    <section id="basico" ref={setSectionRef('basico')} className={`${styles.section} mobileSectionCard`}>
                        <button
                            type="button"
                            className="accordionHeaderButton"
                            onClick={() => toggleAccordion('basico')}
                            aria-expanded={accordionsOpen.basico}
                        >
                            <div className="accordionHeaderLeft">
                                <i className="bi bi-file-earmark-text" style={{ color: 'var(--color-primary)' }} />
                                <span>Información Básica</span>
                            </div>
                            <i className={`bi bi-chevron-${accordionsOpen.basico ? 'up' : 'down'}`} />
                        </button>

                        <div className={`accordionBodyMobile ${!accordionsOpen.basico ? 'accordionBodyHidden' : ''}`}>
                            <h2 className={`${styles.sectionTitle} desktopSectionTitle`}>
                                Información Básica
                            </h2>
                            <CategoryTabBasico
                                form={formProps.form}
                                errors={formProps.fieldErrors}
                                setField={formProps.setField}
                                parentCategories={parentCategories}
                            />
                        </div>
                    </section>

                    {/* ── Imágenes ── */}
                    <section
                        id="imagenes"
                        ref={setSectionRef('imagenes')}
                        className={`${styles.section} mobileSectionCard`}
                    >
                        <button
                            type="button"
                            className="accordionHeaderButton"
                            onClick={() => toggleAccordion('imagenes')}
                            aria-expanded={accordionsOpen.imagenes}
                        >
                            <div className="accordionHeaderLeft">
                                <i className="bi bi-image" style={{ color: 'var(--color-primary)' }} />
                                <span>Imagen de Categoría</span>
                            </div>
                            <i className={`bi bi-chevron-${accordionsOpen.imagenes ? 'up' : 'down'}`} />
                        </button>

                        <div className={`accordionBodyMobile ${!accordionsOpen.imagenes ? 'accordionBodyHidden' : ''}`}>
                            <h2 className={`${styles.sectionTitle} desktopSectionTitle`}>
                                Imagen de Categoría
                            </h2>
                            <fieldset className={styles.fieldset}>
                                <p className={styles.fieldHint}>
                                    Subí una imagen representativa para la categoría.
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
                                            alt="Preview"
                                            className={styles.imagePreviewImg}
                                        />
                                        <span className={styles.fieldHint}>Imagen actual</span>
                                        <button
                                            type="button"
                                            onClick={formProps.handleDeleteImage}
                                            className={styles.deleteImageBtn}
                                            title="Eliminar imagen"
                                            aria-label="Eliminar imagen actual"
                                        >
                                            <X size={16} />
                                        </button>
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
                                        <button
                                            type="button"
                                            onClick={formProps.handleDeleteImage}
                                            className={styles.deleteImageBtn}
                                            title="Eliminar imagen"
                                            aria-label="Eliminar nueva imagen"
                                        >
                                            <X size={16} />
                                        </button>
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
                            </fieldset>
                        </div>
                    </section>

                    {/* Mensaje de error global */}
                    {error && (
                        <div className={styles.globalError} role="alert">
                            {error}
                        </div>
                    )}
                </form>
            </div>

            {/* Barra fija de acciones para móvil */}
            <div className="fixedBottomBarMobile">
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
                message="Tenés cambios sin guardar. ¿Estás seguro de que querés abandonar?"
                confirmText="Sí, abandonar"
                cancelText="Seguir editando"
                onConfirm={() => {
                    blocker.proceed?.();
                }}
                onCancel={() => {
                    blocker.reset?.();
                }}
            />
        </div>
    );
}