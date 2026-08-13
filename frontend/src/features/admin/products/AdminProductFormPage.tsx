import React, { useEffect, useMemo, useCallback, useState } from 'react';
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

import { ArrowLeft } from 'lucide-react';
import styles from './AdminProductFormPage.module.css';

interface Props {
    productId: string | null;
    onBack: () => void;
    onSuccess: () => void;
    onUnsavedChanges?: (unsaved: boolean) => void;
}

type SectionId = 'basico' | 'precios' | 'categorias' | 'imagenes' | 'variantes' | 'proveedor' | 'seo';

function useIsMobile(breakpoint = 767) {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
    );

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [breakpoint]);

    return isMobile;
}

export function AdminProductFormPage({
    productId,
    onBack,
    onSuccess,
    onUnsavedChanges,
}: Props) {
    const formRef = React.useRef<HTMLFormElement | null>(null);
    const isMobile = useIsMobile(767);

    // MOBILE-FIRST: Acordeones colapsados por defecto en móvil para navegación limpia
    const [accordionsOpen, setAccordionsOpen] = useState<Record<SectionId, boolean>>({
        basico: false,
        precios: false,
        categorias: false,
        imagenes: false,
        variantes: false,
        proveedor: false,
        seo: false,
    });

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
        if (isDirty) {
            interceptNavigation(() => {
                onBack();
            });
        } else {
            onBack();
        }
    }, [isDirty, interceptNavigation, onBack]);

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
            proveedor: open,
            seo: open,
        });
    }, []);

    const { sectionErrors, saving, error, isEdit, loading } = formProps;

    const renderMobileBottomBar = () => {
        if (!isMobile) return null;

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
                .fixedBottomBarMobile {
                    display: none !important;
                }

                @media (max-width: 1023px) {
                    .stickyFormHeaderMobile {
                        position: sticky !important;
                        top: 0 !important;
                        z-index: 30 !important;
                        background: rgba(17, 24, 39, 0.95) !important;
                        backdrop-filter: blur(8px) !important;
                        -webkit-backdrop-filter: blur(8px) !important;
                        border: none !important;
                        border-bottom: 1px solid var(--color-border, #374151) !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 10px !important;
                        padding: 8px 12px !important;
                        margin: 0 0 8px 0 !important;
                        width: 100% !important;
                        height: 64px !important;
                        box-sizing: border-box !important;
                    }

                    .stickyFormHeaderMobile .pageHeaderInner {
                        display: flex !important;
                        align-items: center !important;
                        gap: 10px !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .mobileBackBtnForm {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: 44px !important;
                        height: 44px !important;
                        min-width: 34px !important;
                        min-height: 34px !important;
                        padding: 0 !important;
                        background: rgba(255, 255, 255, 0.08) !important;
                        border: 1px solid var(--color-border, #374151) !important;
                        border-radius: 8px !important;
                        color: var(--color-text-primary, #ffffff) !important;
                        flex-shrink: 0 !important;
                        border: none !important;
                        cursor: pointer !important;
                    }

                    .desktopOnlyText,
                    .desktopOnlyActions {
                        display: none !important;
                    }

                    .stickyFormHeaderMobile .pageTitle {
                        font-size: 15px !important;
                        font-weight: 700 !important;
                        color: var(--color-text-primary, #ffffff) !important;
                        margin: 0 !important;
                        white-space: nowrap !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        flex: 1 !important;
                        line-height: 1.2 !important;
                    }

                    .formPageMobileResponsive {
                        background: transparent !important;
                        padding-bottom: 100px !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    .formPageMobileResponsive form {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .formPageMobileResponsive [class*="layout"],
                    .formPageMobileResponsive [class*="mainColumn"],
                    .formPageMobileResponsive [class*="sideColumn"] {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        gap: 0 !important;
                    }

                    .cardSectionMobile {
                        border: 1px solid var(--color-border, #374151) !important;
                        border-left: none !important;
                        border-right: none !important;
                        border-radius: 0 !important;
                        overflow: hidden !important;
                        background: var(--color-bg-secondary, #1f2937) !important;
                        margin: 0 0 10px 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    .accordionHeaderButton {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        padding: 12px 16px !important;
                        background: var(--color-bg-secondary, #1f2937) !important;
                        border: none !important;
                        color: var(--color-text-primary, #ffffff) !important;
                        font-size: 14px !important;
                        font-weight: 700 !important;
                        cursor: pointer !important;
                        min-height: 48px !important;
                        text-align: left !important;
                    }

                    .accordionHeaderLeft {
                        display: flex !important;
                        align-items: center !important;
                        gap: 8px !important;
                    }

                    /* Transición suave basada en CSS Grid */
                    .accordionCollapsible {
                        display: grid !important;
                        grid-template-rows: 0fr !important;
                        transition: grid-template-rows 250ms cubic-bezier(0.16, 1, 0.3, 1) !important;
                    }

                    .accordionCollapsibleOpen {
                        grid-template-rows: 1fr !important;
                    }

                    .accordionCollapsibleInner {
                        overflow: hidden !important;
                    }

                    .accordionBodyMobile {
                        width: 100% !important;
                        box-sizing: border-box !important;
                        padding: 16px !important;
                        border-top: 1px solid var(--color-border, #374151) !important;
                        background: var(--color-bg-secondary, #1f2937) !important;
                    }

                    .accordionBodyHidden {
                        display: none !important;
                    }

                    .desktopSectionTitle {
                        display: none !important;
                    }

                    .accordionToggleBarMobile {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 8px !important;
                        padding: 0 16px 6px 16px !important;
                        margin: 0 0 4px 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    .accordionToggleBtn {
                        background: transparent !important;
                        border: none !important;
                        color: var(--color-primary, #769282) !important;
                        font-size: 12px !important;
                        font-weight: 600 !important;
                        cursor: pointer !important;
                        padding: 2px 4px !important;
                    }

                    .accordionToggleSep {
                        color: var(--color-border, #6b7280) !important;
                        font-size: 11px !important;
                    }

                    .fixedBottomBarMobile {
                        position: fixed !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        z-index: 50 !important;
                        background: rgba(15, 23, 42, 0.92) !important;
                        backdrop-filter: blur(8px) !important;
                        -webkit-backdrop-filter: blur(8px) !important;
                        border-top: 1px solid var(--color-border, #374151) !important;
                        padding: 10px 16px calc(10px + env(safe-area-inset-bottom)) 16px !important;
                        display: flex !important;
                        gap: 10px !important;
                    }

                    .fixedBottomBarMobile button {
                        flex: 1 !important;
                        min-height: 44px !important;
                        border-radius: 8px !important;
                        font-size: 14px !important;
                        font-weight: 600 !important;
                    }
                }

                @media (min-width: 1024px) {
                    .accordionHeaderButton {
                        display: none !important;
                    }
                    .accordionCollapsible {
                        display: block !important;
                        grid-template-rows: none !important;
                    }
                    .accordionCollapsibleInner {
                        overflow: visible !important;
                    }
                    .accordionBodyHidden {
                        display: block !important;
                    }
                    .accordionToggleBarMobile,
                    .fixedBottomBarMobile {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Header pegajoso superior */}
            <header className={`${styles.pageHeader} stickyFormHeaderMobile`}>
                <div className={styles.pageHeaderInner}>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className={`${styles.backBtn} mobileBackBtnForm`}
                        aria-label="Volver al listado"
                    >
                        <ArrowLeft size={18} />
                        <span className="desktopOnlyText">Productos</span>
                    </button>
                    <h1 className={styles.pageTitle}>
                        {isEdit ? `Editar: ${formProps.form.name || 'Sin nombre'}` : 'Nuevo producto'}
                    </h1>
                </div>
                <div className={`${styles.pageHeaderActions} desktopOnlyActions`}>
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
                onSubmit={formProps.handleSubmit}
                noValidate
            >
                <div className={styles.layout}>
                    {/* COLUMNA PRINCIPAL (Izquierda - 68% en Desktop) */}
                    <div className={styles.mainColumn}>
                        {/* ── Básico ── */}
                        <section id="basico" className={`${styles.cardSection} cardSectionMobile`}>
                            <button
                                type="button"
                                className="accordionHeaderButton"
                                onClick={() => toggleAccordion('basico')}
                                aria-expanded={accordionsOpen.basico}
                            >
                                <div className="accordionHeaderLeft">
                                    <i className="bi bi-file-earmark-text" />
                                    <span>Información Básica</span>
                                    {sectionErrors.basico && (
                                        <i className="bi bi-exclamation-circle-fill" style={{ color: 'var(--color-error)' }} />
                                    )}
                                </div>
                                <i className={`bi bi-chevron-${accordionsOpen.basico ? 'up' : 'down'}`} />
                            </button>

                            <div className={`accordionCollapsible ${accordionsOpen.basico ? 'accordionCollapsibleOpen' : ''}`}>
                                <div className="accordionCollapsibleInner">
                                    <div className="accordionBodyMobile">
                                        <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                            <i className="bi bi-file-earmark-text" /> Información Básica
                                        </h2>
                                        <TabBasico
                                            form={formProps.form}
                                            fieldErrors={formProps.fieldErrors}
                                            errors={formProps.fieldErrors}
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
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── Precios y Stock ── */}
                        <section id="precios" className={`${styles.cardSection} cardSectionMobile`}>
                            <button
                                type="button"
                                className="accordionHeaderButton"
                                onClick={() => toggleAccordion('precios')}
                                aria-expanded={accordionsOpen.precios}
                            >
                                <div className="accordionHeaderLeft">
                                    <i className="bi bi-currency-dollar" />
                                    <span>Precio y Stock</span>
                                    {sectionErrors.precios && (
                                        <i className="bi bi-exclamation-circle-fill" style={{ color: 'var(--color-error)' }} />
                                    )}
                                </div>
                                <i className={`bi bi-chevron-${accordionsOpen.precios ? 'up' : 'down'}`} />
                            </button>

                            <div className={`accordionCollapsible ${accordionsOpen.precios ? 'accordionCollapsibleOpen' : ''}`}>
                                <div className="accordionCollapsibleInner">
                                    <div className="accordionBodyMobile">
                                        <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                            <i className="bi bi-currency-dollar" /> Precios y Stock
                                        </h2>
                                        <TabPreciosInventario
                                            form={formProps.form}
                                            fieldErrors={formProps.fieldErrors}
                                            errors={formProps.fieldErrors}
                                            isEdit={formProps.isEdit}
                                            setField={formProps.setField}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── Imágenes ── */}
                        <section id="imagenes" className={`${styles.cardSection} cardSectionMobile`}>
                            <button
                                type="button"
                                className="accordionHeaderButton"
                                onClick={() => toggleAccordion('imagenes')}
                                aria-expanded={accordionsOpen.imagenes}
                            >
                                <div className="accordionHeaderLeft">
                                    <i className="bi bi-image" />
                                    <span>Galería de Imágenes</span>
                                    {sectionErrors.imagenes && (
                                        <i className="bi bi-exclamation-circle-fill" style={{ color: 'var(--color-error)' }} />
                                    )}
                                </div>
                                <i className={`bi bi-chevron-${accordionsOpen.imagenes ? 'up' : 'down'}`} />
                            </button>

                            <div className={`accordionCollapsible ${accordionsOpen.imagenes ? 'accordionCollapsibleOpen' : ''}`}>
                                <div className="accordionCollapsibleInner">
                                    <div className="accordionBodyMobile">
                                        <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                            <i className="bi bi-image" /> Galería de Imágenes
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
                                </div>
                            </div>
                        </section>

                        {/* ── Variantes y Combinaciones ── */}
                        <section id="variantes" className={`${styles.cardSection} cardSectionMobile`}>
                            <button
                                type="button"
                                className="accordionHeaderButton"
                                onClick={() => toggleAccordion('variantes')}
                                aria-expanded={accordionsOpen.variantes}
                            >
                                <div className="accordionHeaderLeft">
                                    <i className="bi bi-layers" />
                                    <span>Variantes y Combinaciones</span>
                                </div>
                                <i className={`bi bi-chevron-${accordionsOpen.variantes ? 'up' : 'down'}`} />
                            </button>

                            <div className={`accordionCollapsible ${accordionsOpen.variantes ? 'accordionCollapsibleOpen' : ''}`}>
                                <div className="accordionCollapsibleInner">
                                    <div className="accordionBodyMobile">
                                        <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                            <i className="bi bi-layers" /> Variantes y Combinaciones
                                        </h2>
                                        <TabVariantes
                                            form={formProps.form}
                                            fieldErrors={formProps.fieldErrors}
                                            errors={formProps.fieldErrors}
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
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* COLUMNA SECUNDARIA (Derecha - 32% en Desktop) */}
                    <div className={styles.sideColumn}>
                        {/* ── Categorías ── */}
                        <section id="categorias" className={`${styles.cardSection} cardSectionMobile`}>
                            <button
                                type="button"
                                className="accordionHeaderButton"
                                onClick={() => toggleAccordion('categorias')}
                                aria-expanded={accordionsOpen.categorias}
                            >
                                <div className="accordionHeaderLeft">
                                    <i className="bi bi-tags" />
                                    <span>Categorías</span>
                                    {sectionErrors.categorias && (
                                        <i className="bi bi-exclamation-circle-fill" style={{ color: 'var(--color-error)' }} />
                                    )}
                                </div>
                                <i className={`bi bi-chevron-${accordionsOpen.categorias ? 'up' : 'down'}`} />
                            </button>

                            <div className={`accordionCollapsible ${accordionsOpen.categorias ? 'accordionCollapsibleOpen' : ''}`}>
                                <div className="accordionCollapsibleInner">
                                    <div className="accordionBodyMobile">
                                        <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                            <i className="bi bi-tags" /> Categorización
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
                                </div>
                            </div>
                        </section>

                        {/* ── Proveedor ── */}
                        <section id="proveedor" className={`${styles.cardSection} cardSectionMobile`}>
                            <button
                                type="button"
                                className="accordionHeaderButton"
                                onClick={() => toggleAccordion('proveedor')}
                                aria-expanded={accordionsOpen.proveedor}
                            >
                                <div className="accordionHeaderLeft">
                                    <i className="bi bi-truck" />
                                    <span>Proveedor Principal</span>
                                </div>
                                <i className={`bi bi-chevron-${accordionsOpen.proveedor ? 'up' : 'down'}`} />
                            </button>

                            <div className={`accordionCollapsible ${accordionsOpen.proveedor ? 'accordionCollapsibleOpen' : ''}`}>
                                <div className="accordionCollapsibleInner">
                                    <div className="accordionBodyMobile">
                                        <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                            <i className="bi bi-truck" /> Proveedor Principal
                                        </h2>
                                        <ProductSupplierSection
                                            productId={productId}
                                            productName={formProps.form.name}
                                            currentProductPrice={formProps.form.price}
                                            primarySupplierId={formProps.form.primarySupplierId}
                                            onPrimaryChange={(id) => formProps.setField('primarySupplierId', id)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── SEO / Publicación ── */}
                        <section id="seo" className={`${styles.cardSection} cardSectionMobile`}>
                            <button
                                type="button"
                                className="accordionHeaderButton"
                                onClick={() => toggleAccordion('seo')}
                                aria-expanded={accordionsOpen.seo}
                            >
                                <div className="accordionHeaderLeft">
                                    <i className="bi bi-globe" />
                                    <span>SEO y Vista Previa</span>
                                </div>
                                <i className={`bi bi-chevron-${accordionsOpen.seo ? 'up' : 'down'}`} />
                            </button>

                            <div className={`accordionCollapsible ${accordionsOpen.seo ? 'accordionCollapsibleOpen' : ''}`}>
                                <div className="accordionCollapsibleInner">
                                    <div className="accordionBodyMobile">
                                        <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                            <i className="bi bi-globe" /> SEO y Vista Previa
                                        </h2>
                                        <TabSEOPublicacion
                                            form={formProps.form}
                                            fieldErrors={formProps.fieldErrors}
                                            isEdit={formProps.isEdit}
                                            setField={formProps.setField}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {error && (
                    <div className={styles.globalError} role="alert" style={{ marginTop: '20px' }}>
                        <i className="bi bi-exclamation-triangle-fill" />
                        {error}
                    </div>
                )}
            </form>

            {/* Barra fija de acciones para móvil */}
            {renderMobileBottomBar()}

            {/* Modal de confirmación de cambios no guardados */}
            <ModalConfirm
                open={showWarning || blocker.state === 'blocked'}
                title="¿Abandonar sin guardar?"
                description="Tenés cambios sin guardar. ¿Estás seguro de que querés abandonar?"
                confirmText="Sí, abandonar"
                cancelText="Seguir editando"
                onConfirm={() => {
                    if (blocker.state === 'blocked') blocker.proceed?.();
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