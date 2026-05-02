import React, { useState, useCallback, useMemo } from 'react';
import type { Category } from '../../../types';
import { CategoryListPanel } from './Categorylistpanel';
import { CategoryDetailPanel } from './Categorydetailpanel';
import styles from './Categoriesmasterdetaillayout.module.css';

interface CategoriesMasterDetailLayoutProps {
    categories: Category[];
    loading?: boolean;
    error?: string | null;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onToggleVisibility?: (id: string, newVisible: boolean) => void;
    canEdit: boolean;
    canDelete: boolean;
    defaultSelectedCategoryId?: string;
    getProductCount?: (category: Category) => number | undefined;
    // Multi-select props (forwarded to CategoryListPanel via CategoriesGrid — kept for API compat)
    selectedIds?: string[];
    onSelect?: (id: string, checked: boolean) => void;
    allSelected?: boolean;
    onSelectAll: (checked: boolean) => void;
}

export function CategoriesMasterDetailLayout({
    categories,
    loading = false,
    error = null,
    onEdit,
    onDelete,
    onToggleVisibility,
    canEdit,
    canDelete,
    defaultSelectedCategoryId,
    getProductCount,
}: CategoriesMasterDetailLayoutProps) {
    // Track the currently selected category id
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
        defaultSelectedCategoryId ?? categories[0]?.id
    );

    // When the list changes (e.g. after a filter), keep selection valid
    React.useEffect(() => {
        if (loading) return;

        if (defaultSelectedCategoryId) {
            const exists = categories.some((c) => c.id === defaultSelectedCategoryId);
            if (exists) {
                setSelectedCategoryId(defaultSelectedCategoryId);
                return;
            }
        }

        // Fall back to first item if current selection disappeared
        if (!categories.some((c) => c.id === selectedCategoryId) && categories.length > 0) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [categories, loading, defaultSelectedCategoryId, selectedCategoryId]);

    const selectedCategory = useMemo(
        () => categories.find((c) => c.id === selectedCategoryId),
        [categories, selectedCategoryId]
    );

    const handleSelectCategory = useCallback((id: string) => {
        setSelectedCategoryId(id);
    }, []);

    return (
        <div className={styles.container}>
            {/* ── Left: scrollable category list ──────────────────────── */}
            <CategoryListPanel
                categories={categories}
                loading={loading}
                error={error}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={handleSelectCategory}
                onEdit={canEdit ? onEdit : undefined}
                onDelete={canDelete ? onDelete : undefined}
                onToggleVisibility={canEdit ? onToggleVisibility : undefined}
                canEdit={canEdit}
                canDelete={canDelete}
                getProductCount={getProductCount}
            />

            {/* ── Right: detail panel ──────────────────────────────────── */}
            <div className={styles.detailWrapper}>
                {selectedCategory ? (
                    <CategoryDetailPanel
                        category={selectedCategory}
                        productCount={getProductCount?.(selectedCategory)}
                        onEdit={canEdit ? onEdit : undefined}
                        onDelete={canDelete ? onDelete : undefined}
                        onToggleVisibility={canEdit ? onToggleVisibility : undefined}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                ) : !loading && categories.length > 0 ? (
                    <div className={styles.emptyDetail}>
                        <p>Seleccioná una categoría para ver sus detalles</p>
                    </div>
                ) : null}

                {loading && (
                    <div className={styles.loadingDetail}>
                        <div className={styles.spinner} />
                    </div>
                )}
            </div>
        </div>
    );
}