import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';
import { useProductForm } from '../../../hooks/useProductFormPage';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';

import { TabBasico } from './tabs/TabBasico';
import { TabPreciosInventario } from './tabs/TabPreciosinventario';
import { TabCategorias } from './tabs/TabCategorias';
import { TabImagenes } from './tabs/TabImagenes';
import { TabVariantes } from './tabs/TabVariantes';
import { TabSEOPublicacion } from './tabs/TabSeoPublicacion';
import { ProductSupplierSection } from './tabs/ProductSupplierSection';

import styles from './AdminProductFormPage.module.css';

interface Props {
    productId: string | null;
    onBack: () => void;
    onSuccess: () => void;
    onUnsavedChanges?: (unsaved: boolean) => void;
}

// ── Section definitions with Bootstrap Icons ────────────────────────────────
const SECTIONS = [
    { id: 'basico', label: 'Básico', icon: 'bi bi-file-earmark-text' },
    { id: 'precios', label: 'Precios', icon: 'bi bi-currency-dollar' },
    { id: 'categorias', label: 'Categorías', icon: 'bi bi-tags' },
    { id: 'imagenes', label: 'Imágenes', icon: 'bi bi-image' },
    { id: 'variantes', label: 'Variantes', icon: 'bi bi-layers' },
    { id: 'seo', label: 'SEO / Publicación', icon: 'bi bi-globe' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

export function AdminProductFormPage({
    productId,
    onBack,
    onSuccess,
    onUnsavedChanges,
}: Props) {
    const formRef = React.useRef<HTMLFormElement | null>(null);

    // Track which section is visible for sidebar highlight
    const [activeSection, setActiveSection] = React.useState<SectionId>('basico');
    const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
        basico: null, precios: null, categorias: null,
        imagenes: null, variantes: null, seo: null,
    });
    const observerRef = useRef<IntersectionObserver | null>(null);

    const formProps = useProductForm({
        productId,
        onSuccess,
        onUnsavedChanges,
    });

    // ── Cálculo de isDirty (Corregido para evitar errores de ESLint) ────────
    const isDirty = useMemo(() => {
        const a = formProps.form;
        const b = formProps.initialForm;

        const keys: (keyof typeof a)[] = [
            'name', 'slug', 'description', 'shortDescription', 'price',
            'images', 'category', 'categoryIds', 'tags', 'inStock', 'isFeatured', 'sku', 'features', 'stock', 'variants'
        ];

        for (const key of keys) {
            const valA = a[key];
            const valB = b[key];

            if (Array.isArray(valA) && Array.isArray(valB)) {
                if (valA.length !== valB.length || valA.some((v, i) => v !== valB[i])) return true;
            } else if (typeof valA === 'object' && valA && valB) {
                if (JSON.stringify(valA) !== JSON.stringify(valB)) return true;
            } else if (valA !== valB) {
                return true;
            }
        }
        return false;
    }, [formProps.form, formProps.initialForm]);

    const {
        showWarning,
        confirmNavigation,
        cancelNavigation,
        interceptNavigation,
        setIsDirty,
    } = useUnsavedChangesWarning({
        active: isDirty,
        onConfirmExit: onBack,
    });

    useEffect(() => {
        setIsDirty(isDirty);
    }, [isDirty, setIsDirty]);

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
        setActiveSection(id);
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

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
            <header className={styles.pageHeader}>
                <div className={styles.pageHeaderInner}>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className={styles.backBtn}
                        aria-label="Volver al listado"
                    >
                        <i className="bi bi-arrow-left" style={{ fontSize: '0.9rem' }}></i>
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
                <nav className={styles.sidebar} aria-label="Secciones del formulario">
                    <ul className={styles.sidebarList}>
                        {SECTIONS.map(section => {
                            const hasError = sectionErrors[section.id as keyof typeof sectionErrors];
                            const isActive = activeSection === section.id;
                            return (
                                <li key={section.id}>
                                    <button
                                        type="button"
                                        className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                                        onClick={() => scrollToSection(section.id)}
                                    >
                                        <i
                                            className={`${section.icon} ${styles.sidebarIcon}`}
                                            style={{
                                                color: isActive ? 'white' : 'var(--color-primary)',
                                                fontSize: '1.1rem'
                                            }}
                                        />
                                        <span className={styles.sidebarLabel}>{section.label}</span>
                                        {hasError && (
                                            <i
                                                className="bi bi-exclamation-circle-fill"
                                                style={{ color: 'var(--color-error)', marginLeft: 'auto', fontSize: '0.8rem' }}
                                                title="Sección con errores"
                                            />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <div className={styles.sidebarProgress}>
                        <div
                            className={styles.sidebarProgressBar}
                            style={{
                                height: `${(SECTIONS.findIndex(s => s.id === activeSection) + 1) / SECTIONS.length * 100}%`
                            }}
                        />
                    </div>
                </nav>

                <form
                    ref={formRef}
                    className={styles.content}
                    onSubmit={formProps.handleSubmit}
                    noValidate
                >
                    <section id="basico" ref={setSectionRef('basico')} className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <legend >Información Básica</legend>
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

                        <ProductSupplierSection
                            productId={productId}
                            productName={formProps.form.name}
                            currentProductPrice={formProps.form.price}
                            primarySupplierId={formProps.form.primarySupplierId}
                            onPrimaryChange={(id) => formProps.setField('primarySupplierId', id)}
                        />
                    </section>

                    <section id="precios" ref={setSectionRef('precios')} className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <legend >Precio y stock</legend>
                        </h2>
                        <TabPreciosInventario
                            form={formProps.form}
                            fieldErrors={formProps.fieldErrors}
                            isEdit={formProps.isEdit}
                            setField={formProps.setField}
                        />
                    </section>

                    <section id="categorias" ref={setSectionRef('categorias')} className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <legend >Categorías</legend>
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

                    <section id="imagenes" ref={setSectionRef('imagenes')} className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <legend >Imágenes</legend>
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
                            deletingImgId={formProps.deletingImgId}
                            fileInputRef={formProps.fileInputRef}
                            onApiUploadImage={formProps.handleApiUploadImage}
                            onApiDeleteImage={formProps.handleApiDeleteImage}
                        />
                    </section>

                    <section id="variantes" ref={setSectionRef('variantes')} className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <legend >Variantes</legend>
                        </h2>
                        <TabVariantes
                            form={formProps.form}
                            fieldErrors={formProps.fieldErrors}
                            isEdit={formProps.isEdit}
                            productId={productId}
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

                    <section id="seo" ref={setSectionRef('seo')} className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <legend>SEO / Publicación</legend>
                        </h2>
                        <TabSEOPublicacion
                            form={formProps.form}
                            fieldErrors={formProps.fieldErrors}
                            isEdit={formProps.isEdit}
                            setField={formProps.setField}
                        />
                    </section>

                    {error && (
                        <div className={styles.globalError} role="alert">
                            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '8px' }}></i>
                            {error}
                        </div>
                    )}

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
                open={showWarning || blocker.state === 'blocked'}
                title="Cambios sin guardar"
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