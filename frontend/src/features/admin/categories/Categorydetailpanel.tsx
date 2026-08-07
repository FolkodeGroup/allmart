import { useState } from 'react';
import type { Category } from '../../../types';
import {
    Eye,
    EyeOff,
    Image as ImageIcon,
    Tag,
    Hash,
    Layers,
    AlertTriangle,
    ArrowLeft
} from 'lucide-react';
import styles from './Categorydetailpanel.module.css';

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

export function CategoryDetailPanel({
    category,
    productCount,
    onEdit,
    onDelete,
    onToggleVisibility,
    canEdit = true,
    canDelete = true,
    onBack,
}: CategoryDetailPanelProps) {
    const displayName = category.name?.trim() || category.slug;
    const [imgError, setImgError] = useState(false);

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
                .catDetailStatVal {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                }
                .catDetailSectionTitle {
                    font-size: 12px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.04em !important;
                    color: var(--color-text-secondary, #6b7280) !important;
                    margin-bottom: 6px !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                }
                .catDetailDesc {
                    font-size: 13px !important;
                    line-height: 1.45 !important;
                    color: var(--color-text-primary, #111827) !important;
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

            {/* ── Stats row ───────────────────────────────────────────── */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <Layers size={15} className={styles.statIcon} />
                    <div>
                        <span className="catDetailStatVal">
                            {productCount !== undefined ? productCount : '—'}
                        </span>
                        <span className={styles.statLabel}>Productos</span>
                    </div>
                </div>

                {productCount === 0 && (
                    <div className={`${styles.statCard} ${styles.statWarn}`}>
                        <AlertTriangle size={15} className={styles.statIconWarn} />
                        <span className={styles.statLabel}>Sin productos asignados</span>
                    </div>
                )}

                <div className={styles.statCard}>
                    <Hash size={15} className={styles.statIcon} />
                    <div>
                        <span className="catDetailStatVal" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                            {category.id.slice(0, 8)}…
                        </span>
                        <span className={styles.statLabel}>ID</span>
                    </div>
                </div>
            </div>

            {/* ── Description ─────────────────────────────────────────── */}
            <div className={styles.section}>
                <h3 className="catDetailSectionTitle">
                    <Tag size={13} /> Descripción
                </h3>
                {category.description ? (
                    <p className="catDetailDesc">{category.description}</p>
                ) : (
                    <p className={styles.emptyDescription}>Sin descripción</p>
                )}
            </div>

            {/* ── Image preview ───────────────────────────────────────── */}
            {category.image && !imgError && (
                <div className={styles.section}>
                    <h3 className="catDetailSectionTitle">
                        <ImageIcon size={13} /> Imagen
                    </h3>
                    <div className={styles.imagePreview}>
                        <img
                            src={category.image}
                            alt={displayName}
                            className={styles.previewImg}
                            onError={() => setImgError(true)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}