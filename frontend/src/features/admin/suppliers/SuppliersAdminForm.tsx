import React, { useCallback, useEffect, useRef } from 'react';
import { Phone, ArrowLeft, AlertCircle, Building2, Globe } from 'lucide-react';
import { useBlocker } from 'react-router-dom';
import { useSupplierForm } from '../../../hooks/useSuppliersForm';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import styles from './SuppliersAdminForm.module.css';

interface Props {
    supplierId: string | null;
    onBack: () => void;
    onSuccess: () => void;
}

// ── Section definitions ──────────────────────────────────────────────────
const SECTIONS = [
    { id: 'identificacion', label: 'Identificación', Icon: Building2 },
    { id: 'contacto', label: 'Contacto', Icon: Phone },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ── Component ────────────────────────────────────────────────────────────
export function SuppliersAdminForm({ supplierId, onBack, onSuccess }: Props) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const savedSuccessfully = useRef(false);
    const handleSuccess = () => {
        savedSuccessfully.current = true;
        onSuccess();
    };

    const [activeSection, setActiveSection] = React.useState<SectionId>('identificacion');
    const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
        identificacion: null,
        contacto: null,
    });
    const observerRef = useRef<IntersectionObserver | null>(null);

    const {
        formData,
        fieldErrors,
        loading,
        error,
        saving,
        isDirty,
        handleField,
        handleSubmit,
    } = useSupplierForm({ id: supplierId ?? undefined, onSuccess: handleSuccess });

    // Block SPA navigation when there are unsaved changes
    const blocker = useBlocker(() => {
        return isDirty && !savedSuccessfully.current;
    });

    // ── Scroll spy ───────────────────────────────────────────────────────
    useEffect(() => {
        observerRef.current?.disconnect();
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    setActiveSection(visible[0].target.id as SectionId);
                }
            },
            { threshold: 0.3, rootMargin: '-60px 0px -60% 0px' }
        );
        SECTIONS.forEach((s) => {
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

    const sectionHasError = (id: SectionId): boolean => {
        if (id === 'identificacion') return !!(fieldErrors.name);
        if (id === 'contacto') return !!(fieldErrors.phone || fieldErrors.address);
        return false;
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Cargando proveedor...</p>
            </div>
        );
    }

    const isEdit = !!supplierId;

    return (
        <div className={styles.page}>
            {/* ── Sticky page header ────────────────────────────────────────── */}
            <header className={styles.pageHeader}>
                <div className={styles.pageHeaderInner}>
                    <button
                        type="button"
                        onClick={onBack}
                        className={styles.backBtn}
                        aria-label="Volver al listado"
                    >
                        <ArrowLeft size={14} />
                        Proveedores
                    </button>
                    <h1 className={styles.pageTitle}>
                        {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
                    </h1>
                </div>
                <div className={styles.pageHeaderActions}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onBack}
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
                        {saving
                            ? 'Guardando...'
                            : isEdit
                                ? 'Guardar cambios'
                                : 'Crear proveedor'}
                    </button>
                </div>
            </header>

            <div className={styles.layout}>
                {/* ── Sticky sidebar nav ──────────────────────────────────────── */}
                <nav className={styles.sidebar} aria-label="Secciones del formulario">
                    <ul className={styles.sidebarList}>
                        {SECTIONS.map((section) => {
                            const hasError = sectionHasError(section.id);
                            return (
                                <li key={section.id}>
                                    <button
                                        type="button"
                                        className={`${styles.sidebarItem} ${activeSection === section.id ? styles.sidebarItemActive : ''
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

                    <div className={styles.sidebarProgress}>
                        <div
                            className={styles.sidebarProgressBar}
                            style={{
                                height: `${((SECTIONS.findIndex((s) => s.id === activeSection) + 1) /
                                    SECTIONS.length) *
                                    100
                                    }%`,
                            }}
                        />
                    </div>
                </nav>

                {/* ── Scrollable form content ──────────────────────────────────── */}
                <form
                    ref={formRef}
                    className={styles.content}
                    onSubmit={handleSubmit}
                    noValidate
                >
                    {/* ── Identificación ─────────────────────────────────────────── */}
                    <section
                        id="identificacion"
                        ref={setSectionRef('identificacion')}
                        className={styles.section}
                    >
                        <h2 className={styles.sectionTitle}>
                            <Building2 size={17} strokeWidth={1.8} />
                            Identificación
                        </h2>
                        <fieldset className={styles.fieldset}>
                            <legend className={styles.legend}>Datos del proveedor</legend>
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="supplier-name">
                                    Nombre *
                                </label>
                                <input
                                    id="supplier-name"
                                    type="text"
                                    className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
                                    value={formData.name}
                                    onChange={handleField('name')}
                                    placeholder="Ej: Distribuidora del Norte"
                                    aria-invalid={!!fieldErrors.name}
                                    aria-describedby={fieldErrors.name ? 'err-name' : undefined}
                                />
                                {fieldErrors.name && (
                                    <span id="err-name" className={styles.errorText}>
                                        {fieldErrors.name}
                                    </span>
                                )}
                            </div>
                        </fieldset>
                    </section>

                    {/* ── Contacto ───────────────────────────────────────────────── */}
                    <section
                        id="contacto"
                        ref={setSectionRef('contacto')}
                        className={styles.section}
                    >
                        <h2 className={styles.sectionTitle}>
                            <Phone size={17} strokeWidth={1.8} />
                            Contacto
                        </h2>
                        <fieldset className={styles.fieldset}>
                            <legend className={styles.legend}>Información de contacto</legend>

                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="supplier-url">
                                    Página web
                                </label>
                                <div className={styles.inputWithIcon}>
                                    <Globe size={14} className={styles.inputIcon} />
                                    <input
                                        id="supplier-url"
                                        type="url"
                                        className={`${styles.input} ${styles.inputIndented} ${fieldErrors.url ? styles.inputError : ''}`}
                                        value={formData.url}
                                        onChange={handleField('url')}
                                        placeholder="https://proveedor.com"
                                        aria-invalid={!!fieldErrors.url}
                                        aria-describedby={fieldErrors.url ? 'err-url' : undefined}
                                    />
                                </div>
                                {fieldErrors.url && (
                                    <span id="err-url" className={styles.errorText}>
                                        {fieldErrors.url}
                                    </span>
                                )}
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="supplier-phone">
                                        Teléfono *
                                    </label>
                                    <input
                                        id="supplier-phone"
                                        type="tel"
                                        className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''}`}
                                        value={formData.phone}
                                        onChange={handleField('phone')}
                                        placeholder="+54 11 1234-5678"
                                        aria-invalid={!!fieldErrors.phone}
                                        aria-describedby={fieldErrors.phone ? 'err-phone' : undefined}
                                    />
                                    {fieldErrors.phone && (
                                        <span id="err-phone" className={styles.errorText}>
                                            {fieldErrors.phone}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label} htmlFor="supplier-address">
                                        Dirección *
                                    </label>
                                    <input
                                        id="supplier-address"
                                        type="text"
                                        className={`${styles.input} ${fieldErrors.address ? styles.inputError : ''}`}
                                        value={formData.address}
                                        onChange={handleField('address')}
                                        placeholder="Calle Falsa 123, CABA"
                                        aria-invalid={!!fieldErrors.address}
                                        aria-describedby={fieldErrors.address ? 'err-address' : undefined}
                                    />
                                    {fieldErrors.address && (
                                        <span id="err-address" className={styles.errorText}>
                                            {fieldErrors.address}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </fieldset>
                    </section>

                    {error && (
                        <div className={styles.globalError} role="alert">
                            {error}
                        </div>
                    )}
                </form>
            </div>

            {/* ── Unsaved changes blocker ───────────────────────────────────────── */}
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