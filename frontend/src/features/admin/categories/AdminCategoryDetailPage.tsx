// pages/AdminCategoryDetailPage.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Eye, EyeOff, Image as ImageIcon, Tag, Hash, Layers, AlertTriangle,
} from 'lucide-react';
import { useAdminCategories } from '../../../context/AdminCategoriesContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useAdminProducts } from '../../../context/useAdminProductsContext';
import { useNotification } from '../../../context';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import styles from './AdminCategoryDetailPage.module.css';

const SECTIONS = [
    { id: 'basico', label: 'Básico' },
    { id: 'productos', label: 'Productos' },
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
    const { products } = useAdminProducts();
    const { can } = useAdminAuth();
    const { showNotification } = useNotification();

    const canEdit = can('categories.edit');
    const canDelete = can('categories.delete');

    const [activeSection, setActiveSection] = useState<SectionId>('basico');
    const [imgError, setImgError] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [toggleConfirm, setToggleConfirm] = useState<{ newVisible: boolean } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Touch swipe refs
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const category = useMemo(
        () => categories.find(
            (c) => c.id === categoryParam || c.slug?.toLowerCase() === categoryParam.toLowerCase()
        ),
        [categories, categoryParam]
    );

    useEffect(() => {
        if (!category) {
            refreshCategories({ page: 1, limit: 50 });
        }
    }, [category, refreshCategories]);

    useEffect(() => {
        if (!category) return;
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

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

    const categoryProducts = useMemo(() => {
        if (!category) return [];

        return products.filter((product) => {
            return product.categoryId === category.id ||
                (Array.isArray(product.categoryIds) && product.categoryIds.includes(category.id));
        });
    }, [products, category]);

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

    // Gestos táctiles de deslizamiento (Swipe left / right) en móvil
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > deltaY * 1.2) {
            if (deltaX < 0 && activeSection === 'basico') {
                setActiveSection('productos');
            } else if (deltaX > 0 && activeSection === 'productos') {
                setActiveSection('basico');
            }
        }
        touchStartX.current = null;
        touchStartY.current = null;
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
        <div className={`${styles.page} detailPageContainerMobile`} ref={pageRef}>
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

            {/* ── Contenido de las pestañas con soporte Swipe en móvil ── */}
            <div
                className={styles.content}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {activeSection === 'basico' && (
                    <div id="panel-basico" role="tabpanel" aria-labelledby="tab-basico" className={styles.tabPanel}>
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

                        {category.image && !imgError && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}><ImageIcon size={14} /> Imagen</h3>
                                <div className={styles.imagePreview}>
                                    <img src={category.image} alt={displayName} onError={() => setImgError(true)} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeSection === 'productos' && (
                    <div id="panel-productos" role="tabpanel" aria-labelledby="tab-productos" className={styles.tabPanel}>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}><Layers size={14} /> Productos Asignados</h3>
                            {categoryProducts.length > 0 ? (
                                <div className={styles.productsListContainer}>
                                    <div className={styles.productsSummaryCard}>
                                        <span className={styles.productCountValue}>{categoryProducts.length}</span>
                                        <span className={styles.productCountLabel}>{categoryProducts.length === 1 ? 'Producto' : 'Productos'}</span>
                                    </div>

                                    <div className={styles.productRows}>
                                        {categoryProducts.map((product) => {
                                            const stockStatus = product.stock === 0 ? 'critical' : product.stock <= 5 ? 'low' : 'normal';

                                            return (
                                                <div key={product.id} className={styles.productRow}>
                                                    <div className={styles.productMainInfo}>
                                                        <span className={styles.productName}>{product.name}</span>
                                                    </div>

                                                    <div className={styles.productSideInfo}>
                                                        <div className={styles.productStockInline}>
                                                            <span className={styles.productStockLabel}>Stock</span>
                                                            <span className={`${styles.productStockValue} ${
                                                                stockStatus === 'critical' ? styles.stockCritical :
                                                                stockStatus === 'low' ? styles.stockLow : ''
                                                            }`}>
                                                                {product.stock}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className={`${styles.productAvailability} ${product.inStock ? styles.available : styles.unavailable}`}>
                                                        {product.inStock ? 'Disponible' : 'Agotado'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.emptyProducts}>
                                    <AlertTriangle size={24} />
                                    <p className={styles.emptyProductsText}>Sin productos asignados</p>
                                    <p className={styles.emptyProductsDesc}>Considera agregar productos a esta categoría.</p>
                                </div>
                            )}
                        </div>
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