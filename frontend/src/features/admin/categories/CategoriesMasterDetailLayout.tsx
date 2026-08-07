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
        <div className={`${styles.container} ${mobileView === 'detail' ? styles.showDetail : ''} masterDetailFlexContainer`}>
            <style>{`
                /* 📱 MÓVIL Y TABLET (<1024px) */
                @media (max-width: 1023px) {
                    .masterDetailFlexContainer {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    .masterDetailFlexContainer .listPaneWrapper {
                        display: ${mobileView === 'detail' ? 'none !important' : 'block !important'};
                        width: 100% !important;
                    }
                    .masterDetailFlexContainer .detailPaneWrapper {
                        display: ${mobileView === 'detail' ? 'block !important' : 'none !important'};
                        width: 100% !important;
                        height: auto !important;
                        max-height: none !important;
                        overflow-y: visible !important;
                    }
                }

                /* 💻 ESCRITORIO (>=1024px) */
                @media (min-width: 1024px) {
                    .masterDetailFlexContainer {
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 16px !important;
                        align-items: flex-start !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    .masterDetailFlexContainer .listPaneWrapper {
                        display: block !important;
                        flex: 0 0 340px !important;
                        width: 340px !important;
                        max-width: 340px !important;
                        min-width: 340px !important;
                        box-sizing: border-box !important;
                    }
                    .masterDetailFlexContainer .detailPaneWrapper {
                        display: block !important;
                        flex: 1 1 0% !important;
                        min-width: 0 !important;
                        width: auto !important;
                        box-sizing: border-box !important;
                    }
                }
            `}</style>

            {/* ── Left: scrollable category list ──────────────────────── */}
            <div className={`${styles.listPane} listPaneWrapper`}>
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
            <div className={`${styles.detailWrapper} detailPaneWrapper`}>
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