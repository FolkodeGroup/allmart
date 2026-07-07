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
// Se renderiza en un portal a document.body con position:fixed, calculando
// sus coordenadas desde el botón disparador. Esto lo desacopla por completo
// del overflow de .tableWrapper (que es scrolleable) evitando que el menú
// "empuje" scroll horizontal/vertical en la tabla al abrirse.
interface RowMenuProps {
    onEdit: () => void;
    onDelete: () => void;
}

const MENU_WIDTH = 150;
const MENU_HEIGHT_ESTIMATE = 100; // ajustar si se agregan/quitan items del menú
const VIEWPORT_MARGIN = 8;

const RowMenu: React.FC<RowMenuProps> = ({ onEdit, onDelete }) => {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Calcula la posición fija del menú en base al botón disparador,
    // evitando que se salga del viewport por abajo o por los costados.
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

    const handleOpen = () => {
        computeCoords();
        setOpen(prev => !prev);
    };

    // Cerrar al hacer clic afuera (considera también el menú portaleado)
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

    // Cerrar con Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    // Al ser position:fixed, sus coordenadas quedan obsoletas si el usuario
    // scrollea (la tabla, la página, etc.) o redimensiona la ventana.
    // Cerrarlo es la solución más simple y robusta para ese caso.
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
                aria-label="Acciones"
            >
                <MoreVertical size={15} />
            </button>

            {open && coords && createPortal(
                <div
                    ref={menuRef}
                    className={`${styles.rowDropdown} ${coords.openUpward ? styles.rowDropdownUp : styles.rowDropdownDown}`}
                    style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
                    role="menu"
                >
                    <button
                        type="button"
                        className={styles.dropdownItem}
                        role="menuitem"
                        onClick={() => run(onEdit)}
                    >
                        Editar
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button
                        type="button"
                        className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                        role="menuitem"
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

// ── Tabla principal ──────────────────────────────────────────────────────────
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
                <span className={styles.emptyIcon}></span>
                <p>Todavía no hay combinaciones.</p>
                <small>Usá el botón de arriba para agregar la primera.</small>
            </div>
        );
    }

    return (
        <div className={styles.tableWrapper}>
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
                                        {Object.entries(s.attributes || {}).map(([k, v]) => (
                                            <span key={k} className={styles.attrChip}>
                                                <span className={styles.attrKey}>{k}</span>
                                                <span className={styles.attrVal}>{v}</span>
                                            </span>
                                        ))}
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
                                        {Object.entries(c.attributes || {}).map(([k, v]) => (
                                            <span key={k} className={styles.attrChip}>
                                                <span className={styles.attrKey}>{k}</span>
                                                <span className={styles.attrVal}>{v}</span>
                                            </span>
                                        ))}
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
    );
};