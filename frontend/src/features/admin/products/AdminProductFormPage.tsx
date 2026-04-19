import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { FileText, DollarSign, Tag, Image, Layers, Globe, ArrowLeft, AlertCircle } from 'lucide-react';
import { useProductForm } from '../../../hooks/useProductFormPage';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';

import { TabBasico } from './tabs/TabBasico';
import { TabPreciosInventario } from './tabs/TabPreciosinventario';
import { TabCategorias } from './tabs/TabCategorias';
import { TabImagenes } from './tabs/TabImagenes';
import { TabVariantes } from './tabs/TabVariantes';
import { TabSEOPublicacion } from './tabs/TabSeoPublicacion';

import styles from './AdminProductFormPage.module.css';

interface Props {
    productId: string | null;
    onBack: () => void;
    onSuccess: () => void;
    onUnsavedChanges?: (unsaved: boolean) => void;
}

// ── Section definitions ────────────────────────────────────────────────────
const SECTIONS = [
    { id: 'basico',     label: 'Básico',           Icon: FileText   },
    { id: 'precios',    label: 'Precios',           Icon: DollarSign },
    { id: 'categorias', label: 'Categorías',        Icon: Tag        },
    { id: 'imagenes',   label: 'Imágenes',          Icon: Image      },
    { id: 'variantes',  label: 'Variantes',         Icon: Layers     },
    { id: 'seo',        label: 'SEO / Publicación', Icon: Globe      },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ── Component ──────────────────────────────────────────────────────────────
export function AdminProductFormPage({
    productId,
    onBack,
    onSuccess,
    onUnsavedChanges,
}: Props) {
    // Ref para el form
    const formRef = React.useRef<HTMLFormElement | null>(null);

    // Track which section is visible for sidebar highlight (IntersectionObserver)
    const [activeSection, setActiveSection] = React.useState<SectionId>('basico');
    const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
        basico: null, precios: null, categorias: null,
        imagenes: null, variantes: null, seo: null,
    });
    const observerRef = useRef<IntersectionObserver | null>(null);

    // All form state + handlers come from the stable hook
    const formProps = useProductForm({
        productId,
        onSuccess,
        onUnsavedChanges,
    });


    // Optimized isDirty: compara solo campos relevantes
    const shallowCompareRelevantFields = React.useCallback((a: typeof formProps.form, b: typeof formProps.form): boolean => {
        const keys: (keyof typeof formProps.form)[] = [
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
    }, []); // stable — pure comparison function needs no deps
    const isDirty = useMemo(
        () => !shallowCompareRelevantFields(formProps.form, formProps.initialForm),
        [formProps.form, formProps.initialForm, shallowCompareRelevantFields]
    );

    const {
        showWarning,
        confirmNavigation,
        cancelNavigation,
        interceptNavigation,
    } = useUnsavedChangesWarning({
        active: isDirty,
        onConfirmExit: onBack,
    });

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
                // Pick the topmost intersecting section
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
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    // ── Section ref setter factory (stable) ───────────────────────────────
    const setSectionRef = useCallback(
        (id: SectionId) => (el: HTMLElement | null) => {
            sectionRefs.current[id] = el;
        },
        []
    );

    const { sectionErrors, saving, error, isEdit, loading } = formProps;

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Cargando producto...</p>
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
                        Productos
                    </button>
                    <h1 className={styles.pageTitle}>
                        {isEdit ? 'Editar producto' : 'Nuevo producto'}
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
                        {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
                    </button>
                </div>
            </header>

            <div className={styles.layout}>
                {/* ── Sticky sidebar nav ───────────────────────────────────── */}
                <nav className={styles.sidebar} aria-label="Secciones del formulario">
                    <ul className={styles.sidebarList}>
                        {SECTIONS.map(section => {
                            const hasError = sectionErrors[section.id as keyof typeof sectionErrors];
                            return (
                                <li key={section.id}>
                                    <button
                                        type="button"
                                        className={`${styles.sidebarItem} ${activeSection === section.id ? styles.sidebarItemActive : ''}`}
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
                                height: `${(SECTIONS.findIndex(s => s.id === activeSection) + 1) / SECTIONS.length * 100}%`
                            }}
                        />
                    </div>
                </nav>

                {/* ── Scrollable form content ──────────────────────────────── */}
                {/* NOTE: form wraps all sections so a single onSubmit handles Enter key.
            Sections are always rendered (no conditional mount) — this is what
            keeps inputs stable across "tab" switches. */}
                <form
                    ref={formRef}
                    className={styles.content}
                    onSubmit={formProps.handleSubmit}
                    noValidate
                >
                    {/* ── Básico ─────────────────────────────────────────────── */}
                    <section
                        id="basico"
                        ref={setSectionRef('basico')}
                        className={styles.section}
                    >
                        <h2 className={styles.sectionTitle}>
                            <FileText size={17} strokeWidth={1.8} /> Información básica
                        </h2>
                        <TabBasico
                            form={formProps.form}
                            fieldErrors={formProps.fieldErrors}
                            isEdit={formProps.isEdit}
                            setField={formProps.setField}
                            tagInput={formProps.tagInput}
                            setTagInput={formProps.setTagInput}
                            featureInput={formProps.featureInput}
                            setFeatureInput={formProps.setFeatureInput}
                            onAddTag={formProps.addTag}
                            onRemoveTag={formProps.removeTag}
                            onAddFeature={formProps.addFeature}
                            onRemoveFeature={formProps.removeFeature}
                        />
                    </section>

                    {/* ── Precios ────────────────────────────────────────────── */}
                    <section
                        id="precios"
                        ref={setSectionRef('precios')}
                        className={styles.section}
                    >
                        <h2 className={styles.sectionTitle}>
                            <DollarSign size={17} strokeWidth={1.8} /> Precios e inventario
                        </h2>
                        <TabPreciosInventario
                            form={formProps.form}
                            fieldErrors={formProps.fieldErrors}
                            isEdit={formProps.isEdit}
                            setField={formProps.setField}
                        />
                    </section>

                    {/* ── Categorías ─────────────────────────────────────────── */}
                    <section
                        id="categorias"
                        ref={setSectionRef('categorias')}
                        className={styles.section}
                    >
                        <h2 className={styles.sectionTitle}>
                            <Tag size={17} strokeWidth={1.8} /> Categorías
                        </h2>
                        <TabCategorias
                            form={formProps.form}
                            fieldErrors={formProps.fieldErrors}
                            isEdit={formProps.isEdit}
                            setField={formProps.setField}
                            categories={formProps.categories}
                            additionalCategoryIds={formProps.additionalCategoryIds}
                            onPrimaryCategoryChange={formProps.handlePrimaryCategoryChange}
                            onAdditionalCategoriesChange={formProps.handleAdditionalCategoriesChange}
                            getCategoryLabel={formProps.getCategoryLabel}
                        />
                    </section>

                    {/* ── Imágenes ───────────────────────────────────────────── */}
                    <section
                        id="imagenes"
                        ref={setSectionRef('imagenes')}
                        className={styles.section}
                    >
                        <h2 className={styles.sectionTitle}>
                            <Image size={17} strokeWidth={1.8} /> Imágenes
                        </h2>
                        <TabImagenes
                            isEdit={formProps.isEdit}
                            productId={productId}
                            images={formProps.form.images}
                            fieldErrors={formProps.fieldErrors}
                            onSetImage={formProps.setImage}
                            onAddImageSlot={formProps.addImageSlot}
                            onRemoveImageSlot={formProps.removeImageSlot}
                            apiImages={formProps.apiImages}
                            imagesLoading={formProps.imagesLoading}
                            imagesError={formProps.imagesError}
                            imgFile={formProps.imgFile}
                            setImgFile={formProps.setImgFile}
                            imgNewAlt={formProps.imgNewAlt}
                            setImgNewAlt={formProps.setImgNewAlt}
                            imgError={formProps.imgError}
                            showAddImgForm={formProps.showAddImgForm}
                            setShowAddImgForm={formProps.setShowAddImgForm}
                            editingImgId={formProps.editingImgId}
                            setEditingImgId={formProps.setEditingImgId}
                            editingImgAlt={formProps.editingImgAlt}
                            setEditingImgAlt={formProps.setEditingImgAlt}
                            savingImgId={formProps.savingImgId}
                            deletingImgId={formProps.deletingImgId}
                            fileInputRef={formProps.fileInputRef}
                            onApiUploadImage={formProps.handleApiUploadImage}
                            onApiStartEdit={formProps.handleApiStartEdit}
                            onApiCommitEdit={formProps.handleApiCommitEdit}
                            onApiDeleteImage={formProps.handleApiDeleteImage}
                        />
                    </section>

                    {/* ── Variantes ──────────────────────────────────────────── */}
                    <section
                        id="variantes"
                        ref={setSectionRef('variantes')}
                        className={styles.section}
                    >
                        <h2 className={styles.sectionTitle}>
                            <Layers size={17} strokeWidth={1.8} /> Variantes
                        </h2>
                        <TabVariantes
                            form={formProps.form}
                            fieldErrors={formProps.fieldErrors}
                            isEdit={formProps.isEdit}
                            setField={formProps.setField}
                            newGroupName={formProps.newGroupName}
                            setNewGroupName={formProps.setNewGroupName}
                            newGroupValues={formProps.newGroupValues}
                            setNewGroupValues={formProps.setNewGroupValues}
                            onAddVariantGroup={formProps.addVariantGroup}
                            onRemoveVariantGroup={formProps.removeVariantGroup}
                            onAddVariantValue={formProps.addVariantValue}
                            onRemoveVariantValue={formProps.removeVariantValue}
                        />
                    </section>

                    {/* ── SEO ────────────────────────────────────────────────── */}
                    <section
                        id="seo"
                        ref={setSectionRef('seo')}
                        className={styles.section}
                    >
                        <h2 className={styles.sectionTitle}>
                            <Globe size={17} strokeWidth={1.8} /> SEO / Publicación
                        </h2>
                        <TabSEOPublicacion
                            form={formProps.form}
                            fieldErrors={formProps.fieldErrors}
                            isEdit={formProps.isEdit}
                            setField={formProps.setField}
                        />
                    </section>

                    {/* ── Global error ───────────────────────────────────────── */}
                    {error && (
                        <div className={styles.globalError} role="alert">
                            {error}
                        </div>
                    )}

                    {/* ── Bottom submit bar ──────────────────────────────────── */}
                    <div className={styles.bottomBar}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Unsaved changes warning */}
            <ModalConfirm
                open={showWarning}
                title="Cambios sin guardar"
                message="¿Salir sin guardar? Los cambios se perderán."
                confirmText="Salir sin guardar"
                cancelText="Quedarme"
                onConfirm={confirmNavigation}
                onCancel={cancelNavigation}
            />
        </div>
    );
}