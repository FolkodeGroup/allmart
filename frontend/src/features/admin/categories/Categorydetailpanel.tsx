import React, { useState, Suspense } from 'react';
import type { Category } from '../../../types';
import {
    Eye,
    EyeOff,
    Image as ImageIcon,
    ArrowLeft,
} from 'lucide-react';
import styles from './Categorydetailpanel.module.css';

// Lazy load tab components
const CategoryDetailBasic = React.lazy(() =>
  import('./tabs/CategoryDetailBasic').then(m => ({ default: m.CategoryDetailBasic }))
);
const CategoryDetailProducts = React.lazy(() =>
  import('./tabs/CategoryDetailProducts').then(m => ({ default: m.CategoryDetailProducts }))
);

type TabName = 'basic' | 'products';

interface CategoryDetailPanelProps {
    category: Category;
    productCount?: number;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onToggleVisibility?: (id: string, newVisible: boolean) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    onBack?: () => void;
    isMobileActive?: boolean;
}

const TAB_LABELS: Record<TabName, string> = {
  basic: 'Básico',
  products: 'Productos',
};

const TAB_ORDER: TabName[] = ['basic', 'products'];

function TabLoadingFallback() {
  return (
    <div className="tabPanelLoading" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
      Cargando...
    </div>
  );
}

export function CategoryDetailPanel({
    category,
    onEdit,
    onDelete,
    onToggleVisibility,
    canEdit = true,
    canDelete = true,
    onBack,
}: CategoryDetailPanelProps) {
    const displayName = category.name?.trim() || category.slug;
    const [activeTab, setActiveTab] = useState<TabName>('basic');
    const [imgError, setImgError] = useState(false);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <Suspense fallback={<TabLoadingFallback />}>
                        <CategoryDetailBasic category={category} />
                    </Suspense>
                );
            case 'products':
                return (
                    <Suspense fallback={<TabLoadingFallback />}>
                        <CategoryDetailProducts category={category} />
                    </Suspense>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.panel}>
            <style>{`
                .catDetailCompactHeader {
                    padding: 12px 14px !important;
                    border-radius: 10px !important;
                    background: var(--color-bg-primary, #ffffff) !important;
                    border: 1px solid var(--color-border, #e5e2dd) !important;
                    margin-bottom: 12px !important;
                }
                .catDetailTitle {
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    margin: 0 !important;
                    color: var(--color-text-primary, #111827) !important;
                }
                .catDetailSlug {
                    font-size: 11px !important;
                    font-family: monospace !important;
                    color: var(--color-text-secondary, #6b7280) !important;
                }
                .catDetailTabsContainer {
                    display: flex !important;
                    gap: 4px !important;
                    border-bottom: 1px solid var(--color-border-light, #e5e2dd) !important;
                    padding: 0 24px !important;
                    margin-bottom: 16px !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                .catDetailTabBtn {
                    padding: 10px 16px !important;
                    background: transparent !important;
                    border: none !important;
                    color: var(--color-text-secondary, #6b7280) !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    white-space: nowrap !important;
                    position: relative !important;
                    transition: color 0.2s ease !important;
                }
                .catDetailTabBtn:hover {
                    color: var(--color-text-primary, #111827) !important;
                }
                .catDetailTabBtn.active {
                    color: var(--color-primary, #769282) !important;
                }
                .catDetailTabBtn.active::after {
                    content: '' !important;
                    position: absolute !important;
                    bottom: -1px !important;
                    left: 0 !important;
                    right: 0 !important;
                    height: 2px !important;
                    background: var(--color-primary, #769282) !important;
                }
                .catDetailTabContent {
                    padding: 0 24px 24px 24px !important;
                    overflow-y: auto !important;
                    flex: 1 !important;
                }
            `}</style>

            {/* ── Header Card ─────────────────────────────────────────── */}
            <div className={`catDetailCompactHeader ${styles.headerCard}`}>
                {onBack && (
                    <button
                        type="button"
                        className={styles.backBtn}
                        onClick={onBack}
                        aria-label="Volver a la lista de categorías"
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>
                )}
                <div className={styles.headerContent}>
                    <div className={styles.titleGroup}>
                        <div className={styles.categoryAvatar}>
                            {category.image && !imgError ? (
                                <img
                                    src={category.image}
                                    alt={displayName}
                                    className={styles.avatarImg}
                                    width={40}
                                    height={40}
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder} aria-hidden="true">
                                    <ImageIcon size={20} />
                                </div>
                            )}
                        </div>

                        <div className={styles.titleSection}>
                            <h2 className="catDetailTitle">{displayName}</h2>
                            <span className="catDetailSlug">{category.slug}</span>
                            <div className={styles.headerStatus}>
                                <button
                                    type="button"
                                    className={`${styles.statusToggle} ${category.isVisible ? styles.chipVisible : styles.chipHidden}`}
                                    onClick={() => canEdit && onToggleVisibility?.(category.id, !category.isVisible)}
                                    disabled={!canEdit}
                                >
                                    {category.isVisible ? <><Eye size={12} /> Visible</> : <><EyeOff size={12} /> Oculta</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {(canEdit || canDelete) && (
                        <div className={styles.desktopActions}>
                            <div className={styles.actions}>
                                {canEdit && onEdit && (
                                    <button
                                        type="button"
                                        className={styles.btnEdit}
                                        onClick={() => onEdit(category.id)}
                                    >
                                        Editar
                                    </button>
                                )}
                                {canDelete && onDelete && (
                                    <button
                                        type="button"
                                        className={styles.btnDelete}
                                        onClick={() => onDelete(category.id)}
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tabs Navigation ─────────────────────────────────────── */}
            <div className="catDetailTabsContainer" role="tablist" aria-label="Secciones de la categoría">
                {TAB_ORDER.map((tabId) => (
                    <button
                        key={tabId}
                        type="button"
                        id={`tab-category-${tabId}`}
                        role="tab"
                        aria-selected={activeTab === tabId}
                        aria-controls={`tabpanel-category-${tabId}`}
                        tabIndex={activeTab === tabId ? 0 : -1}
                        className={`catDetailTabBtn ${activeTab === tabId ? 'active' : ''}`}
                        onClick={() => setActiveTab(tabId)}
                    >
                        {TAB_LABELS[tabId]}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ────────────────────────────────────────── */}
            <div
                className="catDetailTabContent"
                id={`tabpanel-category-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`tab-category-${activeTab}`}
            >
                {renderTabContent()}
            </div>
        </div>
    );
}