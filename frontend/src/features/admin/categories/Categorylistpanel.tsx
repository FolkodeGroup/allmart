import React, { useRef, useEffect } from 'react';
import type { Category } from '../../../types';
import { FolderSearch, AlertCircle, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProductImage } from '../../../components/ui/ProductImage';
import styles from './Categorylistpanel.module.css';

interface CategoryListPanelProps {
    categories: Category[];
    loading: boolean;
    error: string | null;
    selectedCategoryId?: string;
    onSelectCategory: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onToggleVisibility?: (id: string, newVisible: boolean) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    getProductCount?: (category: Category) => number | undefined;
    scrollPreserveKey?: string;
}

export const CategoryListPanel = React.forwardRef<HTMLElement, CategoryListPanelProps>(
    (
        {
            categories,
            loading,
            error,
            selectedCategoryId,
            onSelectCategory,
            onEdit,
            onDelete,
            onToggleVisibility,
            canEdit = true,
            canDelete = true,
            getProductCount,
            scrollPreserveKey = 'category-list-scroll',
        },
        ref
    ) => {
        const containerRef = useRef<HTMLElement>(null);

        useEffect(() => {
            const scrollPos = sessionStorage.getItem(scrollPreserveKey);
            if (scrollPos && containerRef.current) {
                containerRef.current.scrollTop = parseInt(scrollPos, 10);
            }
        }, [scrollPreserveKey]);

        const handleScroll = () => {
            if (containerRef.current) {
                sessionStorage.setItem(scrollPreserveKey, containerRef.current.scrollTop.toString());
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCategory(categories[index].id);
            } else if (e.key === 'ArrowDown' && index < categories.length - 1) {
                e.preventDefault();
                (e.currentTarget.parentElement?.children[index + 1] as HTMLElement)?.focus();
                onSelectCategory(categories[index + 1].id);
            } else if (e.key === 'ArrowUp' && index > 0) {
                e.preventDefault();
                (e.currentTarget.parentElement?.children[index - 1] as HTMLElement)?.focus();
                onSelectCategory(categories[index - 1].id);
            }
        };

        if (error) {
            return (
                <aside ref={ref ?? containerRef} className={styles.panel}>
                    <EmptyState
                        icon={<AlertCircle size={48} color="#ef4444" />}
                        title="Error al cargar categorías"
                        description={error}
                    />
                </aside>
            );
        }

        if (loading) {
            return (
                <aside ref={ref ?? containerRef} className={styles.panel}>
                    <div className={styles.loadingContainer}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <div className={styles.skeletonImage} />
                                <div className={styles.skeletonContent}>
                                    <div className={styles.skeletonLine} />
                                    <div className={styles.skeletonLine} style={{ width: '60%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            );
        }

        if (categories.length === 0) {
            return (
                <aside ref={ref ?? containerRef} className={styles.panel}>
                    <EmptyState
                        icon={<FolderSearch size={48} color="#94a3b8" />}
                        title="No se encontraron categorías"
                        description="Ajustá los filtros o la búsqueda."
                    />
                </aside>
            );
        }

        return (
            <aside
                ref={ref ?? containerRef}
                className={styles.panel}
                onScroll={handleScroll}
            >
                <div className={styles.listContainer} role="listbox" aria-label="Lista de categorías">
                    {categories.map((cat, index) => {
                        const displayName = cat.name?.trim() || cat.slug;
                        const productCount = getProductCount?.(cat);
                        const isSelected = selectedCategoryId === cat.id;

                        return (
                            <div
                                key={cat.id}
                                data-category-id={cat.id}
                                className={`${styles.categoryWrapper} ${isSelected ? styles.selected : ''}`}
                                role="option"
                                tabIndex={0}
                                aria-selected={isSelected}
                                aria-label={`Seleccionar categoría ${displayName}`}
                                onClick={() => onSelectCategory(cat.id)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                            >
                                <div className={styles.mainRow}>
                                    {cat.image ? (
                                        <ProductImage
                                            src={cat.image}
                                            alt={displayName}
                                            className={styles.thumbnail}
                                            width={48}
                                            height={48}
                                        />
                                    ) : (
                                        <div className={styles.thumbnailPlaceholder} aria-hidden="true">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className={styles.content}>
                                        <div className={styles.headerLine}>
                                            <h3 className={styles.title}>{displayName}</h3>
                                            <span
                                                className={`${styles.visibilityBadge} ${cat.isVisible ? styles.visible : styles.hidden}`}
                                            >
                                                {cat.isVisible ? 'Visible' : 'Oculta'}
                                            </span>
                                        </div>

                                        <div className={styles.metaLine}>
                                            <span className={styles.slug} title={`Slug: ${cat.slug}`}>
                                                {cat.slug}
                                            </span>
                                            {productCount !== undefined && (
                                                <>
                                                    <span className={styles.separator}>·</span>
                                                    <span
                                                        className={`${styles.productCount} ${productCount === 0 ? styles.emptyCount : ''}`}
                                                    >
                                                        {productCount === 0 ? 'Sin productos' : `${productCount} prod.`}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {(canEdit || canDelete) && (
                                    <div className={styles.quickActions}>
                                        {canEdit && onEdit && (
                                            <button
                                                className={styles.quickBtn}
                                                title="Editar"
                                                onClick={(e) => { e.stopPropagation(); onEdit(cat.id); }}
                                                aria-label={`Editar ${displayName}`}
                                                type="button"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                        {canEdit && onToggleVisibility && (
                                            <button
                                                className={styles.quickBtn}
                                                title={cat.isVisible ? 'Ocultar' : 'Mostrar'}
                                                onClick={(e) => { e.stopPropagation(); onToggleVisibility(cat.id, !cat.isVisible); }}
                                                aria-label={`${cat.isVisible ? 'Ocultar' : 'Mostrar'} ${displayName}`}
                                                type="button"
                                            >
                                                {cat.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        )}
                                        {canDelete && onDelete && (
                                            <button
                                                className={`${styles.quickBtn} ${styles.quickBtnDanger}`}
                                                title="Eliminar"
                                                onClick={(e) => { e.stopPropagation(); onDelete(cat.id); }}
                                                aria-label={`Eliminar ${displayName}`}
                                                type="button"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>
        );
    }
);

CategoryListPanel.displayName = 'CategoryListPanel';