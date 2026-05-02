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
}

export function CategoryDetailPanel({
    category,
    productCount,
    onEdit,
    onDelete,
    onToggleVisibility,
    canEdit = true,
    canDelete = true,
}: CategoryDetailPanelProps) {
    const displayName = category.name?.trim() || category.slug;
    const [imgError, setImgError] = useState(false);

    return (
        <div className={styles.panel}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className={styles.panelHeader}>
                <div className={styles.headerContent}>
                    <div className={styles.categoryAvatar}>
                        {category.image && !imgError ? (
                            <img
                                src={category.image}
                                alt={displayName}
                                className={styles.avatarImg}
                                width={64}
                                height={64}
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className={styles.avatarPlaceholder} aria-hidden="true">
                                <ImageIcon size={28} />
                            </div>
                        )}
                    </div>

                    <div className={styles.titleSection}>
                        <h2 className={styles.panelTitle}>{displayName}</h2>
                        <span className={styles.slugBadge}>{category.slug}</span>
                    </div>

                    <span
                        className={`${styles.visibilityChip} ${category.isVisible ? styles.chipVisible : styles.chipHidden}`}
                    >
                        {category.isVisible ? (
                            <><Eye size={13} /> Visible</>
                        ) : (
                            <><EyeOff size={13} /> Oculta</>
                        )}
                    </span>
                </div>
            </div>

            {/* ── Stats row ───────────────────────────────────────────── */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <Layers size={16} className={styles.statIcon} />
                    <div>
                        <span className={styles.statValue}>
                            {productCount !== undefined ? productCount : '—'}
                        </span>
                        <span className={styles.statLabel}>Productos</span>
                    </div>
                </div>

                {productCount === 0 && (
                    <div className={`${styles.statCard} ${styles.statWarn}`}>
                        <AlertTriangle size={16} className={styles.statIconWarn} />
                        <span className={styles.statLabel}>Sin productos asignados</span>
                    </div>
                )}

                <div className={styles.statCard}>
                    <Hash size={16} className={styles.statIcon} />
                    <div>
                        <span className={styles.statValue} style={{ fontSize: 11, fontFamily: 'monospace' }}>
                            {category.id.slice(0, 8)}…
                        </span>
                        <span className={styles.statLabel}>ID</span>
                    </div>
                </div>
            </div>

            {/* ── Description ─────────────────────────────────────────── */}
            {category.description ? (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <Tag size={14} /> Descripción
                    </h3>
                    <p className={styles.description}>{category.description}</p>
                </div>
            ) : (
                <div className={styles.section}>
                    <p className={styles.emptyDescription}>Sin descripción</p>
                </div>
            )}

            {/* ── Image preview ───────────────────────────────────────── */}
            {category.image && !imgError && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <ImageIcon size={14} /> Imagen
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

            {/* ── Footer actions ───────────────────────────────────────── */}
            {(canEdit || canDelete) && (
                <div className={styles.panelFooter}>
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

                        {canEdit && onToggleVisibility && (
                            <button
                                type="button"
                                className={styles.btnToggle}
                                onClick={() => onToggleVisibility(category.id, !category.isVisible)}
                            >
                                {category.isVisible ? (
                                    <>Ocultar</>
                                ) : (
                                    <>Mostrar</>
                                )}
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
    );
}