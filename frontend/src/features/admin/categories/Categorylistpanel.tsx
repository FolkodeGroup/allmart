import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';
import type { Category } from '../../../types';
import { FolderSearch, AlertCircle } from 'lucide-react';
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
            scrollPreserveKey = 'category-list-scroll',
        },
        ref
    ) => {
        const navigate = useNavigate();
        const isMobile = useIsMobileViewport(1023);
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

        const handleRowActivate = (id: string, slug: string) => {
            if (isMobile) {
                navigate(`/admin/categorias/${slug || id}/detalle`);
            } else {
                onSelectCategory(id);
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
            <aside ref={ref ?? containerRef} className={`${styles.panel} categoryListPanelDesktopScroll`} onScroll={handleScroll}>
                <style>{`
                    .catListContainerFix {
                        padding-bottom: 48px !important;
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .catListCompactItem {
                        padding: 8px 10px !important;
                        border-radius: 8px !important;
                        margin-bottom: 4px !important;
                        transition: all 0.15s ease !important;
                    }
                    .catListCompactThumb {
                        width: 36px !important;
                        height: 36px !important;
                        min-width: 36px !important;
                        border-radius: 6px !important;
                    }
                    .catListCompactTitle {
                        font-size: 13px !important;
                        font-weight: 600 !important;
                        line-height: 1.25 !important;
                    }
                    .catListCompactSlug {
                        font-size: 11px !important;
                        font-family: monospace !important;
                        color: var(--color-text-secondary, #9ca3af) !important;
                    }
                    .catListCompactMeta {
                        font-size: 11px !important;
                        color: var(--color-text-secondary, #9ca3af) !important;
                    }
                    @media (min-width: 1024px) {
                        .categoryListPanelDesktopScroll {
                            max-height: calc(100vh - 280px) !important;
                            min-height: 520px !important;
                            overflow-y: auto !important;
                            box-sizing: border-box !important;
                            padding-right: 6px !important;
                        }
                        .categoryListPanelDesktopScroll::-webkit-scrollbar {
                            width: 6px;
                        }
                        .categoryListPanelDesktopScroll::-webkit-scrollbar-track {
                            background: rgba(0, 0, 0, 0.1);
                            border-radius: 4px;
                        }
                        .categoryListPanelDesktopScroll::-webkit-scrollbar-thumb {
                            background: var(--color-border, #374151);
                            border-radius: 4px;
                        }
                        .categoryListPanelDesktopScroll::-webkit-scrollbar-thumb:hover {
                            background: var(--color-primary, #769282);
                        }
                    }
                `}</style>
                <div className={`${styles.listContainer} catListContainerFix`} role="listbox" aria-label="Lista de categorías">
                    {categories.map((cat, index) => {
                        const displayName = cat.name?.trim() || cat.slug;
                        const isSelected = selectedCategoryId === cat.id;

                        return (
                            <div
                                key={cat.id}
                                data-category-id={cat.id}
                                className={`${styles.categoryWrapper} catListCompactItem ${isSelected ? styles.selected : ''}`}
                                role="option"
                                tabIndex={0}
                                aria-selected={isSelected}
                                aria-label={`Seleccionar categoría ${displayName}`}
                                onClick={() => handleRowActivate(cat.id, cat.slug)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleRowActivate(cat.id, cat.slug);
                                    } else {
                                        handleKeyDown(e, index);
                                    }
                                }}
                            >
                                <div className={styles.mainRow}>
                                    {cat.image ? (
                                        <ProductImage
                                            src={cat.image}
                                            alt={displayName}
                                            className={`${styles.thumbnail} catListCompactThumb`}
                                            width={36}
                                            height={36}
                                        />
                                    ) : (
                                        <div className={`${styles.thumbnailPlaceholder} catListCompactThumb`} aria-hidden="true">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div className={styles.content}>
                                        <div className={styles.headerLine}>
                                            <h3 className={`${styles.title} catListCompactTitle`}>{displayName}</h3>
                                            <span className={`${styles.slug} catListCompactSlug`} title={`Slug: ${cat.slug}`}>
                                                {cat.slug}
                                            </span>
                                        </div>

                                        <div className={`${styles.metaLine} catListCompactMeta`}>
                                            <span
                                                className={`${styles.visibilityBadge} ${cat.isVisible ? styles.visible : styles.hidden}`}
                                            >
                                                {cat.isVisible ? 'Visible' : 'Oculta'}
                                            </span>
                                            {/* Removed stock/product count to simplify UI */}
                                        </div>
                                    </div>
                                </div>


                            </div>
                        );
                    })}
                </div>
            </aside>
        );
    }
);

CategoryListPanel.displayName = 'CategoryListPanel';