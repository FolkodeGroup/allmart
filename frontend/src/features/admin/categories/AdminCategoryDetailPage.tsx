// pages/AdminCategoryDetailPage.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Eye, EyeOff, Image as ImageIcon, Tag, Hash, Layers, AlertTriangle,
} from 'lucide-react';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useNotification } from '../../../context';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import styles from './AdminCategoryDetailPage.module.css';

const SECTIONS = [
    { id: 'info', label: 'Información' },
    { id: 'imagen', label: 'Imagen' },
] as const;
type SectionId = typeof SECTIONS[number]['id'];

interface Props {
    categoryParam: string;
    onBack: () => void;
}

export function AdminCategoryDetailPage({ categoryParam, onBack }: Props) {
    const navigate = useNavigate();
    const pageRef = useRef<HTMLDivElement>(null);
    const { categories, isLoading, refreshCategories, updateCategory, deleteCategory } = useAdminCategories();
    const { can } = useAdminAuth();
    const { showNotification } = useNotification();

    const canEdit = can('categories.edit');
    const canDelete = can('categories.delete');

    const [activeSection, setActiveSection] = useState<SectionId>('info');
    const [imgError, setImgError] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [toggleConfirm, setToggleConfirm] = useState<{ newVisible: boolean } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const category = useMemo(
        () => categories.find(
            (c) => c.id === categoryParam || c.slug?.toLowerCase() === categoryParam.toLowerCase()
        ),
        [categories, categoryParam]
    );

    // Si todavía no cargó la lista (entrada directa por URL), pedila
    useEffect(() => {
        if (!category) {
            refreshCategories({ page: 1, limit: 50 });
        }
    }, [category, refreshCategories]);

    useEffect(() => {
        if (!category) return; // esperá a que el contenido real esté montado

        // 1) scroll del documento
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // 2) por si el que scrollea es un contenedor interno del admin layout
        let el = pageRef.current?.parentElement ?? null;
        while (el) {
            const style = window.getComputedStyle(el);
            if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
                el.scrollTop = 0;
            }
            el = el.parentElement;
        }
    }, [categoryParam, category?.id, category]);

    const displayName = category?.name?.trim() || category?.slug || '';
    const productCount = category?.itemCount;

    const handleEdit = () => {
        if (category) navigate(`/admin/categorias/${category.id}/editar`);
    };

    const confirmDelete = async () => {
        if (!category) return;
        setActionLoading(true);
        try {
            await deleteCategory(category.id);
            showNotification('success', 'Categoría eliminada correctamente');
            navigate('/admin/categorias');
        } catch (err: unknown) {
            showNotification('error', err instanceof Error ? err.message : 'Error al eliminar la categoría');
        } finally {
            setActionLoading(false);
            setDeleteConfirm(false);
        }
    };

    const confirmToggle = async () => {
        if (!category || !toggleConfirm) return;
        setActionLoading(true);
        try {
            await updateCategory(category.id, { isVisible: toggleConfirm.newVisible });
            showNotification('success', toggleConfirm.newVisible ? 'Categoría visible' : 'Categoría oculta');
            await refreshCategories({ page: 1, limit: 50 });
        } catch (err: unknown) {
            showNotification('error', err instanceof Error ? err.message : 'Error al cambiar visibilidad');
        } finally {
            setActionLoading(false);
            setToggleConfirm(null);
        }
    };

    if (isLoading && !category) {
        return <LoadingSpinner message="Cargando categoría..." size="lg" />;
    }

    if (!category) {
        return (
            <EmptyState
                icon={<AlertTriangle size={48} color="#ef4444" />}
                title="Categoría no encontrada"
                description="Puede que haya sido eliminada o que el enlace sea incorrecto."
                action={{ label: 'Volver a categorías', onClick: onBack }}
            />
        );
    }

    return (
        <div className={styles.page} ref={pageRef}>
            <header className={styles.header}>
                <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Volver a la lista">
                    <ArrowLeft size={16} /> Categorías
                </button>
            </header>

            {/* ── Resumen (siempre visible arriba) ─────────────────────── */}
            <div className={styles.summary}>
                <div className={styles.avatar}>
                    {category.image && !imgError ? (
                        <img src={category.image} alt={displayName} onError={() => setImgError(true)} />
                    ) : (
                        <ImageIcon size={28} />
                    )}
                </div>
                <div>
                    <h1 className={styles.title}>{displayName}</h1>
                    <span className={styles.slug}>{category.slug}</span>
                </div>
                <span className={`${styles.chip} ${category.isVisible ? styles.chipVisible : styles.chipHidden}`}>
                    {category.isVisible ? <><Eye size={13} /> Visible</> : <><EyeOff size={13} /> Oculta</>}
                </span>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div className={styles.tabs} role="tablist" aria-label="Secciones de la categoría">
                {SECTIONS.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        id={`tab-${s.id}`}
                        role="tab"
                        aria-selected={activeSection === s.id}
                        aria-controls={`panel-${s.id}`}
                        tabIndex={activeSection === s.id ? 0 : -1}
                        className={`${styles.tabBtn} ${activeSection === s.id ? styles.tabActive : ''}`}
                        onClick={() => setActiveSection(s.id)}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className={styles.content}>
                {activeSection === 'info' && (
                    <div id="panel-info" role="tabpanel" aria-labelledby="tab-info">
                        <div className={styles.statsRow}>
                            <div className={styles.statCard}>
                                <Layers size={16} />
                                <div>
                                    <span className={styles.statValue}>{productCount ?? '—'}</span>
                                    <span className={styles.statLabel}>Productos</span>
                                </div>
                            </div>
                            {productCount === 0 && (
                                <div className={`${styles.statCard} ${styles.statWarn}`}>
                                    <AlertTriangle size={16} />
                                    <span className={styles.statLabel}>Sin productos asignados</span>
                                </div>
                            )}
                            <div className={styles.statCard}>
                                <Hash size={16} />
                                <div>
                                    <span className={styles.statValue} style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                        {category.id.slice(0, 8)}…
                                    </span>
                                    <span className={styles.statLabel}>ID</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}><Tag size={14} /> Descripción</h3>
                            {category.description ? (
                                <p className={styles.description}>{category.description}</p>
                            ) : (
                                <p className={styles.emptyDescription}>Sin descripción</p>
                            )}
                        </div>
                    </div>
                )}

                {activeSection === 'imagen' && (
                    <div className={styles.section} id="panel-imagen" role="tabpanel" aria-labelledby="tab-imagen">
                        {category.image && !imgError ? (
                            <div className={styles.imagePreview}>
                                <img src={category.image} alt={displayName} onError={() => setImgError(true)} />
                            </div>
                        ) : (
                            <p className={styles.emptyDescription}>Esta categoría no tiene imagen cargada.</p>
                        )}
                    </div>
                )}
            </div>

            {/* ── Acciones: únicas disponibles en mobile ───────────────── */}
            {(canEdit || canDelete) && (
                <div className={styles.footer}>
                    {canEdit && (
                        <button type="button" className={styles.btnEdit} onClick={handleEdit} disabled={actionLoading}>
                            Editar
                        </button>
                    )}
                    {canEdit && (
                        <button
                            type="button"
                            className={styles.btnToggle}
                            disabled={actionLoading}
                            onClick={() => setToggleConfirm({ newVisible: !category.isVisible })}
                        >
                            {category.isVisible ? 'Ocultar' : 'Mostrar'}
                        </button>
                    )}
                    {canDelete && (
                        <button
                            type="button"
                            className={styles.btnDelete}
                            disabled={actionLoading}
                            onClick={() => setDeleteConfirm(true)}
                        >
                            Eliminar
                        </button>
                    )}
                </div>
            )}

            <ModalConfirm
                open={deleteConfirm}
                title="Eliminar categoría"
                description="¿Seguro que querés eliminar esta categoría? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm(false)}
            />

            <ModalConfirm
                open={!!toggleConfirm}
                title={toggleConfirm?.newVisible ? 'Mostrar categoría' : 'Ocultar categoría'}
                description={
                    toggleConfirm?.newVisible
                        ? '¿Mostrar esta categoría? Será visible para los usuarios.'
                        : '¿Ocultar esta categoría? No será visible para los usuarios.'
                }
                confirmText={toggleConfirm?.newVisible ? 'Mostrar' : 'Ocultar'}
                cancelText="Cancelar"
                onConfirm={confirmToggle}
                onCancel={() => setToggleConfirm(null)}
            />
        </div>
    );
}