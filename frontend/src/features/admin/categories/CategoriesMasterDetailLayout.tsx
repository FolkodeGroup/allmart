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
    selectedIds?: string[];
    onSelect?: (id: string, checked: boolean) => void;
    allSelected?: boolean;
    onSelectAll?: (checked: boolean) => void;
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
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
        defaultSelectedCategoryId ?? categories[0]?.id
    );

    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

    React.useEffect(() => {
        if (loading) return;

        if (defaultSelectedCategoryId) {
            const exists = categories.some((c) => c.id === defaultSelectedCategoryId);
            if (exists) {
                setSelectedCategoryId(defaultSelectedCategoryId);
                return;
            }
        }

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
        setMobileView('detail');
    }, []);

    const handleBackToList = useCallback(() => {
        setMobileView('list');
    }, []);

    return (
        <div className={`${styles.container} ${mobileView === 'detail' ? styles.showDetail : ''} masterDetailGridContainer`}>
            <style>{`
                .masterDetailGridContainer {
                    display: grid !important;
                    grid-template-columns: 1fr !important;
                    gap: 16px !important;
                    width: 100% !important;
                    align-items: start !important;
                }
                @media (min-width: 1024px) {
                    .masterDetailGridContainer {
                        grid-template-columns: 350px minmax(0, 1fr) !important;
                    }
                }
            `}</style>

            {/* ── Left: scrollable category list ──────────────────────── */}
            <div className={styles.listPane}>
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
            </div>

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
                        onBack={handleBackToList}
                        isMobileActive={mobileView === 'detail'}
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