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
            <div className={`${styles.fixedBottomBarMobile} fixedBottomBarMobile`}>
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
                        position: relative !important;
                        top: auto !important;
                        z-index: 10 !important;
                        background: transparent !important;
                        border-bottom: 1px solid var(--color-border, rgba(229, 226, 221, 0.15)) !important;
                        box-shadow: none !important;
                        padding: 8px 4px 12px 4px !important;
                        margin: 0 0 12px 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    .formPageMobileResponsive {
                        background: transparent !important;
                        padding-bottom: 120px !important;
                    }

                    .cardSectionMobile {
                        border: 1px solid var(--color-border, #374151) !important;
                        border-radius: 12px !important;
                        overflow: hidden !important;
                        background: var(--color-bg-secondary, #1f2937) !important;
                        margin-bottom: 12px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }

                    .accordionHeaderButton {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        padding: 14px 16px !important;
                        background: var(--color-bg-secondary, #1f2937) !important;
                        border: none !important;
                        color: var(--color-text-primary, #ffffff) !important;
                        font-size: 15px !important;
                        font-weight: 700 !important;
                        cursor: pointer !important;
                        min-height: 52px !important;
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

                @media (min-width: 1024px) {
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

            {/* Header pegajoso superior */}
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
                        {isEdit ? `Editar producto: ${formProps.form.name || 'Sin nombre'}` : 'Nuevo producto'}
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

                            <div className={`accordionBodyMobile ${!accordionsOpen.basico ? 'accordionBodyHidden' : ''}`}>
                                <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                    <i className="bi bi-file-earmark-text" /> Información Básica
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

                            <div className={`accordionBodyMobile ${!accordionsOpen.precios ? 'accordionBodyHidden' : ''}`}>
                                <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                    <i className="bi bi-currency-dollar" /> Precios y Stock
                                </h2>
                                <TabPreciosInventario
                                    form={formProps.form}
                                    fieldErrors={formProps.fieldErrors}
                                    isEdit={formProps.isEdit}
                                    setField={formProps.setField}
                                />
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

                            <div className={`accordionBodyMobile ${!accordionsOpen.imagenes ? 'accordionBodyHidden' : ''}`}>
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

                            <div className={`accordionBodyMobile ${!accordionsOpen.variantes ? 'accordionBodyHidden' : ''}`}>
                                <h2 className={`${styles.cardSectionTitle} desktopSectionTitle`}>
                                    <i className="bi bi-layers" /> Variantes y Combinaciones
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

                            <div className={`accordionBodyMobile ${!accordionsOpen.categorias ? 'accordionBodyHidden' : ''}`}>
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

                            <div className={`accordionBodyMobile ${!accordionsOpen.proveedor ? 'accordionBodyHidden' : ''}`}>
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

                            <div className={`accordionBodyMobile ${!accordionsOpen.seo ? 'accordionBodyHidden' : ''}`}>
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