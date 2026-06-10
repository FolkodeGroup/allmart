import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, X, DollarSign, TrendingUp, Star, Trash2 } from 'lucide-react';
import {
    suppliersAdminService,
    type AdminSupplierV2,
    type ProductSupplierEntry,
} from '../../suppliers/suppliersAdminService';
import { PriceUpdateModal } from '../../suppliers/PriceUpdateModal';
import { PriceHistoryModal } from '../../suppliers/PriceHistoryModal';
import styles from './ProductSupplierSection.module.css';
const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
interface ProductSupplierSectionProps {
    productId: string | null;          // null = create mode
    productName?: string;
    currentProductPrice?: number;      // used as default price when assigning
    primarySupplierId: string | null | undefined;
    onPrimaryChange: (id: string | null) => void;
}
export function ProductSupplierSection({
    productId,
    productName = '',
    currentProductPrice = 0,
    primarySupplierId,
    onPrimaryChange,
}: ProductSupplierSectionProps) {
    // ── All suppliers (for dropdown) ──────────────────────────────────────
    const [allSuppliers, setAllSuppliers] = useState<AdminSupplierV2[]>([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    // ── Product-supplier links (edit mode) ────────────────────────────────
    const [productLinks, setProductLinks] = useState<ProductSupplierEntry[]>([]);
    const [linksLoading, setLinksLoading] = useState(false);
    // ── Dropdown ──────────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    // ── Modals ────────────────────────────────────────────────────────────
    const [updatingSupplier, setUpdatingSupplier] = useState<ProductSupplierEntry | null>(null);
    const [viewingHistory, setViewingHistory] = useState<ProductSupplierEntry | null>(null);
    // ── Loading action ────────────────────────────────────────────────────
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    // ── Load all suppliers ────────────────────────────────────────────────
    useEffect(() => {
        setSuppliersLoading(true);
        suppliersAdminService.listSuppliers({ limit: 200, isActive: true })
            .then(res => setAllSuppliers(res.data))
            .catch(() => setAllSuppliers([]))
            .finally(() => setSuppliersLoading(false));
    }, []);
    // ── Load product links (edit mode only) ───────────────────────────────
    const loadLinks = useCallback(() => {
        if (!productId) return;
        setLinksLoading(true);
        suppliersAdminService.getProductSuppliers(productId)
            .then(setProductLinks)
            .catch(() => setProductLinks([]))
            .finally(() => setLinksLoading(false));
    }, [productId]);
    useEffect(() => { loadLinks(); }, [loadLinks]);
    // ── Close dropdown on outside click ──────────────────────────────────
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);
    // ── Derived ───────────────────────────────────────────────────────────
    const primaryLink = productLinks.find(l => l.supplierId === primarySupplierId) ?? null;
    const otherLinks = productLinks.filter(l => l.supplierId !== primarySupplierId);
    const selectedSupplierName = primarySupplierId
        ? allSuppliers.find(s => s.id === primarySupplierId)?.name ?? 'Proveedor seleccionado'
        : null;
    const filtered = allSuppliers.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase())
    );
    // ── Handlers ──────────────────────────────────────────────────────────
    async function handleSelect(supplierId: string | null) {
        setOpen(false);
        setSearch('');
        if (!productId) {
            // create mode: just store the selection in parent form
            onPrimaryChange(supplierId);
            return;
        }
        if (!supplierId) {
            // clear primary
            onPrimaryChange(null);
            return;
        }
        setActionLoading('select');
        try {
            const alreadyLinked = productLinks.some(l => l.supplierId === supplierId);
            if (!alreadyLinked) {
                // assign with current product price as default
                await suppliersAdminService.assignSupplier(productId, {
                    supplierId,
                    currentPrice: currentProductPrice || 1,
                    changeReason: 'regular',
                });
            }
            await suppliersAdminService.setPrimarySupplier(productId, supplierId);
            onPrimaryChange(supplierId);
            loadLinks();
        } catch (err) {
            console.error('Error setting primary supplier:', err);
        } finally {
            setActionLoading(null);
        }
    }
    async function handleSetPrimary(supplierId: string) {
        if (!productId) return;
        setActionLoading(`primary-${supplierId}`);
        try {
            await suppliersAdminService.setPrimarySupplier(productId, supplierId);
            onPrimaryChange(supplierId);
            loadLinks();
        } catch (err) {
            console.error('Error setting primary supplier:', err);
        } finally {
            setActionLoading(null);
        }
    }
    async function handleRemove(supplierId: string) {
        if (!productId) return;
        if (!confirm('Deseas remover este proveedor del producto?')) return;
        setActionLoading(`remove-${supplierId}`);
        try {
            await suppliersAdminService.removeProductSupplier(productId, supplierId);
            if (primarySupplierId === supplierId) onPrimaryChange(null);
            loadLinks();
        } catch (err) {
            console.error('Error removing supplier:', err);
        } finally {
            setActionLoading(null);
        }
    }
    async function handlePriceSave(data: { cost: number; changeReason: string }) {
        if (!productId || !updatingSupplier) return;
        try {
            await suppliersAdminService.updateProductSupplierPrice(productId, updatingSupplier.supplierId, {
                cost: data.cost,
                changeReason: data.changeReason,
            });
            loadLinks();
        } catch (err) {
            console.error('Error updating price:', err);
            throw err;
        }
    }
    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className={styles.section}>
            {/* ── Dropdown ── */}
            <div className={styles.fieldGroup}>
                <label htmlFor="primary-supplier-select" className={styles.label}>Proveedor Principal</label>
                <div className={styles.dropdown} ref={dropdownRef}>
                    <button
                        id="primary-supplier-select"
                        type="button"
                        className={styles.dropdownTrigger}
                        onClick={() => setOpen(v => !v)}
                        disabled={suppliersLoading || actionLoading === 'select'}
                    >
                        <span className={selectedSupplierName ? styles.selectedName : styles.placeholder}>
                            {suppliersLoading ? 'Cargando proveedores...'
                                : actionLoading === 'select' ? 'Asignando...'
                                : selectedSupplierName ?? 'Sin proveedor'}
                        </span>
                        {primarySupplierId && (
                            <div
                                className={styles.clearBtn}
                                onClick={e => { e.stopPropagation(); handleSelect(null); }}
                                title="Quitar proveedor principal"
                                role="button"
                                tabIndex={0}
                            >
                                <X size={13} />
                            </div>
                        )}
                        <ChevronDown size={15} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
                    </button>
                    {open && (
                        <div className={styles.dropdownList}>
                            <div className={styles.searchBox}>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar proveedor..."
                                    className={styles.searchInput}
                                />
                            </div>
                            <div className={styles.options}>
                                <button type="button" className={styles.option} onClick={() => handleSelect(null)}>
                                    <span className={styles.optionNone}>— Sin proveedor —</span>
                                </button>
                                {filtered.length === 0 ? (
                                    <div className={styles.noOptions}>Sin resultados</div>
                                ) : filtered.map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className={`${styles.option} ${s.id === primarySupplierId ? styles.optionActive : ''}`}
                                        onClick={() => handleSelect(s.id)}
                                    >
                                        <span className={styles.optionName}>{s.name}</span>
                                        {s.id === primarySupplierId && <Star size={12} className={styles.activeStar} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* ── Primary supplier info (edit mode only) ── */}
            {primarySupplierId && productId && (
                <div className={styles.supplierCard}>
                    {linksLoading ? (
                        <div className={styles.cardLoading}>Cargando datos del proveedor...</div>
                    ) : primaryLink ? (
                        <>
                            <div className={styles.cardStats}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Precio actual</span>
                                    <span className={styles.statValue}>{fmt.format(primaryLink.currentPrice)}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Costo</span>
                                    <span className={styles.statValue}>
                                        {primaryLink.cost != null ? fmt.format(primaryLink.cost) : '—'}
                                    </span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Margen</span>
                                    <span className={`${styles.statValue} ${
                                        primaryLink.cost && primaryLink.currentPrice
                                            ? (((primaryLink.currentPrice - primaryLink.cost) / primaryLink.cost) * 100) < 10
                                                ? styles.statDanger
                                                : (((primaryLink.currentPrice - primaryLink.cost) / primaryLink.cost) * 100) < 15
                                                    ? styles.statWarn
                                                    : styles.statOk
                                            : ''
                                    }`}>
                                        {primaryLink.cost != null && primaryLink.currentPrice > 0
                                            ? `${(((primaryLink.currentPrice - primaryLink.cost) / primaryLink.cost) * 100).toFixed(1)}%`
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                <button
                                    type="button"
                                    className={styles.actionBtn}
                                    onClick={() => setUpdatingSupplier(primaryLink)}
                                >
                                    <DollarSign size={14} /> Actualizar Costo
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                                    onClick={() => setViewingHistory(primaryLink)}
                                >
                                    <TrendingUp size={14} /> Ver Histrico
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.cardLoading}>Proveedor asignado — sin datos de precio an</div>
                    )}
                </div>
            )}
            {/* ── Otros Proveedores (edit mode only) ── */}
            {productId && otherLinks.length > 0 && (
                <div className={styles.otherSection}>
                    <div className={styles.otherTitle}>Otros proveedores asignados</div>
                    <div className={styles.otherTable}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Proveedor</th>
                                    <th>Precio</th>
                                    <th>Costo</th>
                                    <th>Margen</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otherLinks.map(link => (
                                    <tr key={link.supplierId}>
                                        <td>{link.supplierName}</td>
                                        <td>{fmt.format(link.currentPrice)}</td>
                                        <td>{link.cost != null ? fmt.format(link.cost) : '—'}</td>
                                        <td>
                                            {link.cost != null && link.currentPrice > 0
                                                ? `${(((link.currentPrice - link.cost) / link.cost) * 100).toFixed(1)}%`
                                                : '—'}
                                        </td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                <button
                                                    type="button"
                                                    className={styles.miniBtn}
                                                    onClick={() => setUpdatingSupplier(link)}
                                                    title="Actualizar costo"
                                                >
                                                    <DollarSign size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.miniBtn}
                                                    disabled={actionLoading === `primary-${link.supplierId}`}
                                                    onClick={() => handleSetPrimary(link.supplierId)}
                                                    title="Establecer como principal"
                                                >
                                                    <Star size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                                                    disabled={actionLoading === `remove-${link.supplierId}`}
                                                    onClick={() => handleRemove(link.supplierId)}
                                                    title="Remover proveedor"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* ── Modals ── */}
            {updatingSupplier && (
                <PriceUpdateModal
                    productName={productName || updatingSupplier.supplierName}
                    currentPrice={updatingSupplier.currentPrice}
                    currentCost={updatingSupplier.cost}
                    onClose={() => setUpdatingSupplier(null)}
                    onSave={handlePriceSave}
                />
            )}
            {viewingHistory && productId && (
                <PriceHistoryModal
                    supplierId={viewingHistory.supplierId}
                    productId={productId}
                    productName={productName}
                    onClose={() => setViewingHistory(null)}
                />
            )}
        </div>
    );
}
