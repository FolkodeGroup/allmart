import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
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

const SECTIONS = [
    { id: 'basico', label: 'Básico', icon: 'bi bi-file-earmark-text' },
    { id: 'precios', label: 'Precios y stock', icon: 'bi bi-currency-dollar' },
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

    // Estado para controlar qué sección está activa en la barra lateral de Escritorio
    const [activeSection, setActiveSection] = useState<SectionId>('basico');

    // 🟢 MOBILE-FIRST: En móvil, TODOS los acordeones inician colapsados por defecto
    const [accordionsOpen, setAccordionsOpen] = useState<Record<SectionId, boolean>>({
        basico: false,
        precios: false,
        categorias: false,
        imagenes: false,
        variantes: false,
        seo: false,
    });

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

    const toggleAccordion = useCallback((id: SectionId) => {
        setAccordionsOpen(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const toggleAllAccordions = useCallback((open: boolean) => {
        setAccordionsOpen({
            basico: open,
            precios: open,
            categorias: open,
            imagenes: open,
            variantes: open,
            seo: open,
        });
    }, []);

    // ── Scroll spy para navegación lateral en Escritorio ─────────────────
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

    const { sectionErrors, saving, error, isEdit, loading } = formProps;

    // Renderizado portaleado de la barra de acciones inferior para móvil
    const renderMobileBottomBar = () => {
        const barMarkup = (
            <div className="fixedBottomBarMobile">
                <button
                    type="button"
                    className={styles.submitBtn}
                    disabled={saving}
                    onClick={() => formRef.current?.requestSubmit()}
                >
                    {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
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
        );

        if (typeof document === 'undefined') return barMarkup;
        return createPortal(barMarkup, document.body);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Cargando producto...</p>
            </div>
        );
    }

    return (
        <div className={`${styles.page} formPageMobileResponsive`}>
            <style>{`
                @media (max-width: 767px) {
                    /* Ocultar barra lateral/tabs de navegación en móvil */
                    .desktopSidebarOnly {
                        display: none !important;
                    }

                    /* Header Sólido Opaco Pegajoso (Anti-Overlap) */
                    .stickyFormHeaderMobile {
                        position: sticky !important;
                        top: 0 !important;
                        z-index: 100 !important;
                        background: var(--color-bg-primary, #111827) !important;
                        border-bottom: 1px solid var(--color-border, #374151) !important;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
                        padding: 12px 14px !important;
                        margin: 0 0 12px 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    /* Alineación de estirado 100% ancho uniforme sin saltos de interfaz */
                    .formPageMobileResponsive .layout,
                    .formPageMobileResponsive .content,
                    .formPageMobileResponsive form {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: stretch !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        padding-left: 4px !important;
                        padding-right: 4px !important;
                        padding-bottom: 120px !important; /* Colchón externo para barra fija */
                    }

                    /* Tarjetas Acordeón 100% Ancho constante */
                    .mobileSectionCard {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        border-radius: 12px !important;
                        border: 1px solid var(--color-border, #374151) !important;
                        background: var(--color-bg-secondary, #28353d) !important;
                        overflow: hidden !important;
                        margin-bottom: 12px !important;
                        align-self: stretch !important;
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

                    .accordionHeaderLeft {
                        display: flex !important;
                        align-items: center !important;
                        gap: 10px !important;
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

                    .desktopSectionTitle {
                        display: none !important;
                    }

                    .desktopBottomBar {
                        display: none !important;
                    }

                    .accordionToggleBarMobile {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: flex-end !important;
                        gap: 8px !important;
                        padding: 0 4px 10px 4px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    .accordionToggleBtn {
                        background: transparent !important;
                        border: none !important;
                        color: var(--color-primary, #769282) !important;
                        font-size: 13px !important;
                        font-weight: 600 !important;
                        cursor: pointer !important;
                        padding: 4px 6px !important;
                    }

                    .accordionToggleSep {
                        color: var(--color-border, #6b7280) !important;
                        font-size: 12px !important;
                    }

                    /* Barra fija inferior portaleada */
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
                    .accordionToggleBarMobile {
                        display: none !important;
                    }
                    .fixedBottomBarMobile {
                        display: none !important;
                    }
                }
            `}</style>

            <header className={`${styles.pageHeader} stickyFormHeaderMobile`}>
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
                {/* Navegación lateral activa SOLO en Escritorio (oculta en móvil) */}
                <nav className={`${styles.sidebar} desktopSidebarOnly`} aria-label="Secciones del formulario">
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

                {/* Control para expandir/colapsar todas las secciones en Móvil */}
                <div className="accordionToggleBarMobile">
                    <button
                        type="button"
                        className="accordionToggleBtn"
                        onClick={() => toggleAllAccordions(true)}
                    >
                        Expandir todo
                    </button>
                    <span className="accordionToggleSep">•</span>
                    <button
                        type="button"
                        className="accordionToggleBtn"
                        onClick={() => toggleAllAccordions(false)}
                    >
                        Colapsar todo
                    </button>
                </div>

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
                                {sectionErrors.basico && (
                                    <i className="bi bi-exclamation-circle-fill" style={{ color: 'var(--color-error)' }} />
                                )}
                            </div>
                            <i className={`bi bi-chevron-${accordionsOpen.basico ? 'up' : 'down'}`} />
                        </button>

                        <div className={`accordionBodyMobile ${!accordionsOpen.basico ? 'accordionBodyHidden' : ''}`}>
                            <h2 className={`${styles.sectionTitle} desktopSectionTitle`}>
                                Información Básica
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
                        </div>
                    </section>

                    {/* ── Precios y Stock ── */}
                    <section id="precios" ref={setSectionRef('precios')} className={`${styles.section} mobileSectionCard`}>
                        <button
                            type="button"
                            className="accordionHeaderButton"
                            onClick={() => toggleAccordion('precios')}
                            aria-expanded={accordionsOpen.precios}
                        >
                            <div className="accordionHeaderLeft">
                                <i className="bi bi-currency-dollar" style={{ color: 'var(--color-primary)' }} />
                                <span>Precio y Stock</span>
                                {sectionErrors.precios && (
                                    <i className="bi bi-exclamation-circle-fill" style={{ color: 'var(--color-error)' }} />
                                )}
                            </div>
                            <i className={`bi bi-chevron-${accordionsOpen.precios ? 'up' : 'down'}`} />
                        </button>

                        <div className={`accordionBodyMobile ${!accordionsOpen.precios ? 'accordionBodyHidden' : ''}`}>
                            <h2 className={`${styles.sectionTitle} desktopSectionTitle`}>
                                Precio y stock
                            </h2>
                            <TabPreciosInventario
                                form={formProps.form}
                                fieldErrors={formProps.fieldErrors}
                                isEdit={formProps.isEdit}
                                setField={formProps.setField}
                            />
                        </div>
                    </section>

                    {/* ── Categorías ── */}
                    <section id="categorias" ref={setSectionRef('categorias')} className={`${styles.section} mobileSectionCard`}>
                        <button
                            type="button"
                            className="accordionHeaderButton"
                            onClick={() => toggleAccordion('categorias')}
                            aria-expanded={accordionsOpen.categorias}
                        >
                            <div className="accordionHeaderLeft">
                                <i className="bi bi-tags" style={{ color: 'var(--color-primary)' }} />
                                <span>Categorías</span>
                                {sectionErrors.categorias && (
                                    <i className="bi bi-exclamation-circle-fill" style={{ color: 'var(--color-error)' }} />
                                )}
                            </div>
                            <i className={`bi bi-chevron-${accordionsOpen.categorias ? 'up' : 'down'}`} />
                        </button>

                        <div className={`accordionBodyMobile ${!accordionsOpen.categorias ? 'accordionBodyHidden' : ''}`}>
                            <h2 className={`${styles.sectionTitle} desktopSectionTitle`}>
                                Categorías
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
                        </div>
                    </section>

                    {/* ── Imágenes ── */}
                    <section id="imagenes" ref={setSectionRef('imagenes')} className={`${styles.section} mobileSectionCard`}>
                        <button
                            type="button"
                            className="accordionHeaderButton"
                            onClick={() => toggleAccordion('imagenes')}
                            aria-expanded={accordionsOpen.imagenes}
                        >
                            <div className="accordionHeaderLeft">
                                <i className="bi bi-image" style={{ color: 'var(--color-primary)' }} />
                                <span>Imágenes</span>
                                {sectionErrors.imagenes && (
                                    <i className="bi bi-exclamation-circle-fill" style={{ color: 'var(--color-error)' }} />
                                )}
                            </div>
                            <i className={`bi bi-chevron-${accordionsOpen.imagenes ? 'up' : 'down'}`} />
                        </button>

                        <div className={`accordionBodyMobile ${!accordionsOpen.imagenes ? 'accordionBodyHidden' : ''}`}>
                            <h2 className={`${styles.sectionTitle} desktopSectionTitle`}>
                                Imágenes
                            </h2>
                            <TabImagenes
                                isEdit={formProps.isEdit}
                                productId={productId}
                                images={formProps.form.images}
                                fieldErrors={formProps.fieldErrors}
                                setField={formProps.setField}
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
                        </div>
                    </section>

                    {/* ── Variantes ── */}
                    <section id="variantes" ref={setSectionRef('variantes')} className={`${styles.section} mobileSectionCard`}>
                        <button
                            type="button"
                            className="accordionHeaderButton"
                            onClick={() => toggleAccordion('variantes')}
                            aria-expanded={accordionsOpen.variantes}
                        >
                            <div className="accordionHeaderLeft">
                                <i className="bi bi-layers" style={{ color: 'var(--color-primary)' }} />
                                <span>Variantes</span>
                            </div>
                            <i className={`bi bi-chevron-${accordionsOpen.variantes ? 'up' : 'down'}`} />
                        </button>

                        <div className={`accordionBodyMobile ${!accordionsOpen.variantes ? 'accordionBodyHidden' : ''}`}>
                            <h2 className={`${styles.sectionTitle} desktopSectionTitle`}>
                                Variantes
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
                        </div>
                    </section>

                    {/* ── SEO / Publicación ── */}
                    <section id="seo" ref={setSectionRef('seo')} className={`${styles.section} mobileSectionCard`}>
                        <button
                            type="button"
                            className="accordionHeaderButton"
                            onClick={() => toggleAccordion('seo')}
                            aria-expanded={accordionsOpen.seo}
                        >
                            <div className="accordionHeaderLeft">
                                <i className="bi bi-globe" style={{ color: 'var(--color-primary)' }} />
                                <span>SEO / Publicación</span>
                            </div>
                            <i className={`bi bi-chevron-${accordionsOpen.seo ? 'up' : 'down'}`} />
                        </button>

                        <div className={`accordionBodyMobile ${!accordionsOpen.seo ? 'accordionBodyHidden' : ''}`}>
                            <h2 className={`${styles.sectionTitle} desktopSectionTitle`}>
                                SEO / Publicación
                            </h2>
                            <TabSEOPublicacion
                                form={formProps.form}
                                fieldErrors={formProps.fieldErrors}
                                isEdit={formProps.isEdit}
                                setField={formProps.setField}
                            />
                        </div>
                    </section>

                    {error && (
                        <div className={styles.globalError} role="alert">
                            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '8px' }}></i>
                            {error}
                        </div>
                    )}

                    {/* Barra de acciones inline para Escritorio */}
                    <div className={`${styles.bottomBar} desktopBottomBar`}>
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
                            onClick={() => formRef.current?.requestSubmit()}
                        >
                            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Barra de acciones fija para Móvil */}
            {renderMobileBottomBar()}

            {/* Modal de confirmación de cambios no guardados */}
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