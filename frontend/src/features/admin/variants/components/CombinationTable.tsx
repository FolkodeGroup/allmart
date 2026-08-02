import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import styles from './CombinationTable.module.css';

interface Sku {
    id: string;
    sku?: string;
    attributes?: Record<string, string>;
    stock?: number;
    price?: number;
    images?: string[];
}

interface LocalCombination {
    id?: string;
    sku?: string;
    attributes: Record<string, string>;
    stock?: number;
    price?: number;
    images?: string[];
}

interface CombinationsTableProps {
    skus: Sku[];
    localCombinations: LocalCombination[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

// ── Menú de tres puntos para cada fila ──────────────────────────────────────
interface RowMenuProps {
    onEdit: () => void;
    onDelete: () => void;
}

const MENU_WIDTH = 150;
const MENU_HEIGHT_ESTIMATE = 100;
const VIEWPORT_MARGIN = 8;

const RowMenu: React.FC<RowMenuProps> = ({ onEdit, onDelete }) => {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const computeCoords = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < MENU_HEIGHT_ESTIMATE + 12;

        let left = rect.right - MENU_WIDTH;
        left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN));

        const top = openUpward ? rect.top - 4 : rect.bottom + 4;

        setCoords({ top, left, openUpward });
    }, []);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        computeCoords();
        setOpen(prev => !prev);
    };

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [open]);

    const run = (fn: () => void) => { fn(); setOpen(false); };

    return (
        <div className={styles.rowMenuWrapper}>
            <button
                ref={triggerRef}
                type="button"
                className={`${styles.menuTrigger} ${open ? styles.menuTriggerActive : ''}`}
                onClick={handleOpen}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label="Acciones de la combinación"
                style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <MoreVertical size={18} />
            </button>

            {open && coords && createPortal(
                <div
                    ref={menuRef}
                    className={`${styles.rowDropdown} ${coords.openUpward ? styles.rowDropdownUp : styles.rowDropdownDown}`}
                    style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH, zIndex: 100010 }}
                    role="menu"
                >
                    <button
                        type="button"
                        className={styles.dropdownItem}
                        role="menuitem"
                        style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
                        onClick={() => run(onEdit)}
                    >
                        Editar
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button
                        type="button"
                        className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                        role="menuitem"
                        style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
                        onClick={() => run(onDelete)}
                    >
                        Eliminar
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

// ── Tabla / Lista principal ──────────────────────────────────────────────────
export const CombinationsTable: React.FC<CombinationsTableProps> = ({
    skus,
    localCombinations,
    onEdit,
    onDelete,
}) => {
    const isEmpty = skus.length === 0 && localCombinations.length === 0;

    if (isEmpty) {
        return (
            <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📦</span>
                <p>Todavía no hay combinaciones.</p>
                <small>Usá los botones de arriba para agregar la primera.</small>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .combTableDesktopView {
                    display: block;
                }
                .combCardsMobileView {
                    display: none;
                }
                @media (max-width: 767px) {
                    .combTableDesktopView {
                        display: none !important;
                    }
                    .combCardsMobileView {
                        display: flex !important;
                        flex-direction: column;
                        gap: 12px;
                        margin-top: 12px;
                    }
                }
                .combMobileCard {
                    background: var(--color-bg-secondary, #28353d);
                    border: 1px solid var(--color-border, #374151);
                    border-radius: 12px;
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                .combMobileCardHeader {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                .combMobileMedia {
                    flex-shrink: 0;
                }
                .combMobileThumb {
                    width: 52px;
                    height: 52px;
                    border-radius: 10px;
                    object-fit: cover;
                    background: var(--color-bg-primary, #111827);
                    border: 1px solid var(--color-border, #374151);
                    display: block;
                }
                .combMobileNoThumb {
                    width: 52px;
                    height: 52px;
                    border-radius: 10px;
                    background: var(--color-bg-primary, #111827);
                    border: 1px solid var(--color-border, #374151);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: var(--color-text-secondary, #9ca3af);
                }
                .combMobileMainInfo {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .combMobileAttrChips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                .combMobileChip {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    background: rgba(118, 146, 130, 0.18);
                    border: 1px solid rgba(118, 146, 130, 0.3);
                    border-radius: 16px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--color-text-primary, #ffffff);
                }
                .combMobileSkuLine {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }
                .combMobileSkuLabel {
                    color: var(--color-text-secondary, #9ca3af);
                    font-weight: 500;
                }
                .combMobileSkuCode {
                    font-family: monospace;
                    font-weight: 700;
                    color: var(--color-text-primary, #ffffff);
                    font-size: 12px;
                    word-break: break-all;
                }
                .combMobileActionArea {
                    flex-shrink: 0;
                }
                .combMobileCardFooter {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 10px;
                    border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
                }
                .combMobilePrice {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .combMobilePriceLabel {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-text-secondary, #9ca3af);
                }
                .combMobilePriceVal {
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--color-text-primary, #ffffff);
                }
                .combStockBadgeOk {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 700;
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                .combStockBadgeZero {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 700;
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }
            `}</style>

            {/* VISTA DESKTOP: TABLA TRADICIONAL */}
            <div className={`${styles.tableWrapper} combTableDesktopView`}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.thImg}>Imagen</th>
                            <th className={styles.thVariant}>Variante</th>
                            <th className={styles.thSku}>SKU</th>
                            <th className={styles.thPrice}>Precio</th>
                            <th className={styles.thStock}>Stock</th>
                            <th className={styles.thActions}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {skus.map(s => (
                            <tr key={s.id} className={styles.row}>
                                <td className={styles.tdImg}>
                                    {Array.isArray(s.images) && s.images.length > 0 ? (
                                        <img src={s.images[0]} alt={s.sku ?? 'imagen'} className={styles.thumb} />
                                    ) : (
                                        <div className={styles.noThumb}>—</div>
                                    )}
                                </td>
                                <td className={styles.tdVariant}>
                                    {Object.entries(s.attributes || {}).length > 0 ? (
                                        <div className={styles.attrList}>
                                            {Object.entries(s.attributes || {}).map(([k, v]) => {
                                                const cleanKey = k.replace(/[:\s]+$/, '').trim();
                                                return (
                                                    <span key={k} className={styles.attrChip}>
                                                        <span className={styles.attrKey}>{cleanKey}:</span>
                                                        <span className={styles.attrVal}>{v}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span className={styles.na}>—</span>
                                    )}
                                </td>
                                <td className={styles.tdSku}>
                                    <code className={styles.skuCode}>{s.sku ?? '—'}</code>
                                </td>
                                <td className={styles.tdPrice}>
                                    {typeof s.price === 'number'
                                        ? `$${s.price.toLocaleString('es-AR')}`
                                        : <span className={styles.na}>—</span>}
                                </td>
                                <td className={styles.tdStock}>
                                    {typeof s.stock === 'number' ? (
                                        <span className={s.stock === 0 ? styles.stockZero : styles.stockOk}>
                                            {s.stock}
                                        </span>
                                    ) : (
                                        <span className={styles.na}>—</span>
                                    )}
                                </td>
                                <td className={styles.tdActions}>
                                    <RowMenu onEdit={() => onEdit(s.id)} onDelete={() => onDelete(s.id)} />
                                </td>
                            </tr>
                        ))}

                        {localCombinations.map((c, idx) => (
                            <tr key={c.id ?? `local-${idx}`} className={`${styles.row} ${styles.rowOptimistic}`}>
                                <td className={styles.tdImg}>
                                    {Array.isArray(c.images) && c.images.length > 0 ? (
                                        <img src={c.images[0]} alt={c.sku ?? 'imagen'} className={styles.thumb} />
                                    ) : (
                                        <div className={styles.noThumb}>—</div>
                                    )}
                                </td>
                                <td className={styles.tdVariant}>
                                    {Object.entries(c.attributes || {}).length > 0 ? (
                                        <div className={styles.attrList}>
                                            {Object.entries(c.attributes || {}).map(([k, v]) => {
                                                const cleanKey = k.replace(/[:\s]+$/, '').trim();
                                                return (
                                                    <span key={k} className={styles.attrChip}>
                                                        <span className={styles.attrKey}>{cleanKey}:</span>
                                                        <span className={styles.attrVal}>{v}</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span className={styles.na}>—</span>
                                    )}
                                </td>
                                <td className={styles.tdSku}>
                                    <code className={styles.skuCode}>{c.sku ?? '—'}</code>
                                </td>
                                <td className={styles.tdPrice}>
                                    {typeof c.price === 'number'
                                        ? `$${c.price.toLocaleString('es-AR')}`
                                        : <span className={styles.na}>—</span>}
                                </td>
                                <td className={styles.tdStock}>
                                    {typeof c.stock === 'number' ? (
                                        <span className={c.stock === 0 ? styles.stockZero : styles.stockOk}>
                                            {c.stock}
                                        </span>
                                    ) : (
                                        <span className={styles.na}>—</span>
                                    )}
                                </td>
                                <td className={styles.tdActions}>
                                    <span className={styles.savingBadge}>Guardando…</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* VISTA MÓVIL: TARJETAS FLUIDAS Y LIMPIAS (SIN MATRIOSHKA) */}
            <div className="combCardsMobileView">
                {skus.map(s => (
                    <div key={s.id} className="combMobileCard">
                        <div className="combMobileCardHeader">
                            <div className="combMobileMedia">
                                {Array.isArray(s.images) && s.images.length > 0 ? (
                                    <img src={s.images[0]} alt={s.sku ?? 'imagen'} className="combMobileThumb" />
                                ) : (
                                    <div className="combMobileNoThumb">📷</div>
                                )}
                            </div>

                            <div className="combMobileMainInfo">
                                <div className="combMobileAttrChips">
                                    {Object.entries(s.attributes || {}).map(([k, v]) => {
                                        const cleanKey = k.replace(/[:\s]+$/, '').trim();
                                        return (
                                            <span key={k} className="combMobileChip">
                                                <strong style={{ color: 'var(--color-text-secondary, #9ca3af)' }}>{cleanKey}:</strong> {v}
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className="combMobileSkuLine">
                                    <span className="combMobileSkuLabel">SKU:</span>
                                    <code className="combMobileSkuCode">{s.sku ?? '—'}</code>
                                </div>
                            </div>

                            <div className="combMobileActionArea">
                                <RowMenu onEdit={() => onEdit(s.id)} onDelete={() => onDelete(s.id)} />
                            </div>
                        </div>

                        <div className="combMobileCardFooter">
                            <div className="combMobilePrice">
                                <span className="combMobilePriceLabel">PRECIO</span>
                                <span className="combMobilePriceVal">
                                    {typeof s.price === 'number' ? `$${s.price.toLocaleString('es-AR')}` : '—'}
                                </span>
                            </div>
                            <div className="combMobileStock">
                                <span className={s.stock === 0 ? "combStockBadgeZero" : "combStockBadgeOk"}>
                                    {typeof s.stock === 'number' ? `${s.stock} un. en stock` : 'Sin stock'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {localCombinations.map((c, idx) => (
                    <div key={c.id ?? `local-${idx}`} className={`combMobileCard ${styles.rowOptimistic}`}>
                        <div className="combMobileCardHeader">
                            <div className="combMobileMedia">
                                {Array.isArray(c.images) && c.images.length > 0 ? (
                                    <img src={c.images[0]} alt={c.sku ?? 'imagen'} className="combMobileThumb" />
                                ) : (
                                    <div className="combMobileNoThumb">📷</div>
                                )}
                            </div>

                            <div className="combMobileMainInfo">
                                <div className="combMobileAttrChips">
                                    {Object.entries(c.attributes || {}).map(([k, v]) => {
                                        const cleanKey = k.replace(/[:\s]+$/, '').trim();
                                        return (
                                            <span key={k} className="combMobileChip">
                                                <strong style={{ color: 'var(--color-text-secondary, #9ca3af)' }}>{cleanKey}:</strong> {v}
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className="combMobileSkuLine">
                                    <span className="combMobileSkuLabel">SKU:</span>
                                    <code className="combMobileSkuCode">{c.sku ?? '—'}</code>
                                </div>
                            </div>

                            <div className="combMobileActionArea">
                                <span className={styles.savingBadge}>Guardando…</span>
                            </div>
                        </div>

                        <div className="combMobileCardFooter">
                            <div className="combMobilePrice">
                                <span className="combMobilePriceLabel">PRECIO</span>
                                <span className="combMobilePriceVal">
                                    {typeof c.price === 'number' ? `$${c.price.toLocaleString('es-AR')}` : '—'}
                                </span>
                            </div>
                            <div className="combMobileStock">
                                <span className={c.stock === 0 ? "combStockBadgeZero" : "combStockBadgeOk"}>
                                    {typeof c.stock === 'number' ? `${c.stock} un. en stock` : 'Sin stock'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};