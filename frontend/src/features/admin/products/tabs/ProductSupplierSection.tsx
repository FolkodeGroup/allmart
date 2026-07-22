/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    suppliersAdminService,
    type AdminSupplierV2,
    type ProductSupplierEntry,
} from '../../suppliers/suppliersAdminService';
import { PriceUpdateModal } from '../../suppliers/PriceUpdateModal';
import { PriceHistoryModal } from '../../suppliers/PriceHistoryModal';
import styles from './ProductSupplierSection.module.css';

const fmt = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
});

interface ProductSupplierSectionProps {
    productId: string | null;          // null = modo creación
    productName?: string;
    currentProductPrice?: number;      // precio base del producto
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
    // ── Todos los proveedores (para el dropdown) ──
    const [allSuppliers, setAllSuppliers] = useState<AdminSupplierV2[]>([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);

    // ── Vínculos actuales del producto (modo edición) ──
    const [productLinks, setProductLinks] = useState<ProductSupplierEntry[]>([]);
    const [linksLoading, setLinksLoading] = useState(false);

    // ── Estado del Dropdown ──
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── Modales ──
    const [updatingSupplier, setUpdatingSupplier] = useState<ProductSupplierEntry | null>(null);
    const [viewingHistory, setViewingHistory] = useState<ProductSupplierEntry | null>(null);

    // ── Cargando acción ──
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Cargar todos los proveedores disponibles
    useEffect(() => {
        setSuppliersLoading(true);
        suppliersAdminService.listSuppliers({ limit: 200, isActive: true })
            .then(res => setAllSuppliers(res.data))
            .catch(() => setAllSuppliers([]))
            .finally(() => setSuppliersLoading(false));
    }, []);

    // Cargar vínculos específicos del producto
    const loadLinks = useCallback(() => {
        if (!productId) return;
        setLinksLoading(true);
        suppliersAdminService.getProductSuppliers(productId)
            .then(setProductLinks)
            .catch(() => setProductLinks([]))
            .finally(() => setLinksLoading(false));
    }, [productId]);

    useEffect(() => { loadLinks(); }, [loadLinks]);

    useEffect(() => {
        if (!productId) {
            setProductLinks([]);
        }
    }, [productId]);

    function createLocalLink(supplierId: string): ProductSupplierEntry {
        const supplier = allSuppliers.find(s => s.id === supplierId);
        return {
            id: `${productId ?? 'new'}-${supplierId}`,
            supplierId,
            supplierName: supplier?.name ?? 'Proveedor',
            supplierEmail: supplier?.email ?? null,
            supplierPhone: supplier?.phone ?? '',
            supplierIsActive: supplier?.isActive ?? true,
            currentPrice: currentProductPrice || 1,
            cost: null,
            isActive: true,
            isPrimary: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Datos derivados
    const primaryLink = productLinks.find(l => l.isPrimary)
        ?? productLinks.find(l => l.supplierId === primarySupplierId)
        ?? null;
    const otherLinks = productLinks.filter(l => !l.isPrimary);

    const selectedSupplierName = primaryLink
        ? primaryLink.supplierName
        : primarySupplierId
            ? allSuppliers.find(s => s.id === primarySupplierId)?.name ?? 'Proveedor seleccionado'
            : null;

    const filtered = allSuppliers.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase())
    );

    // ── Handlers ──
    async function handleSelect(supplierId: string | null) {
        setOpen(false);
        setSearch('');
        if (!supplierId) {
            onPrimaryChange(null);
            if (!productId) {
                setProductLinks(prev => prev.map(link => ({ ...link, isPrimary: false })));
            }
            return;
        }

        const alreadyPrimary = supplierId === primarySupplierId;
        const hasPrimary = Boolean(primarySupplierId);

        if (!productId) {
            setProductLinks(prev => {
                if (!hasPrimary) {
                    return [
                        ...prev.map(link => ({ ...link, isPrimary: false })),
                        { ...createLocalLink(supplierId), isPrimary: true },
                    ];
                }

                if (alreadyPrimary) {
                    return prev;
                }

                const alreadyAdded = prev.some(link => link.supplierId === supplierId);
                if (alreadyAdded) return prev;

                return [
                    ...prev,
                    createLocalLink(supplierId),
                ];
            });

            if (!hasPrimary) {
                onPrimaryChange(supplierId);
            }
            return;
        }

        setActionLoading('select');
        try {
            if (!hasPrimary) {
                const alreadyLinked = productLinks.some(l => l.supplierId === supplierId);
                if (!alreadyLinked) {
                    await suppliersAdminService.assignSupplier(productId, {
                        supplierId,
                        currentPrice: currentProductPrice || 1,
                        changeReason: 'regular',
                    });
                }
                await suppliersAdminService.setPrimarySupplier(productId, supplierId);
                onPrimaryChange(supplierId);
            } else if (!alreadyPrimary) {
                const alreadyLinked = productLinks.some(l => l.supplierId === supplierId);
                if (!alreadyLinked) {
                    await suppliersAdminService.assignSupplier(productId, {
                        supplierId,
                        currentPrice: currentProductPrice || 1,
                        changeReason: 'regular',
                    });
                }
            }
            loadLinks();
        } finally {
            setActionLoading(null);
        }
    }

    async function handleSetPrimary(supplierId: string) {
        if (!productId) {
            setProductLinks(prev => {
                const hasSupplier = prev.some(link => link.supplierId === supplierId);
                const updated = prev.map(link => ({
                    ...link,
                    isPrimary: link.supplierId === supplierId,
                }));
                if (hasSupplier) return updated;
                return [
                    ...updated,
                    { ...createLocalLink(supplierId), isPrimary: true },
                ];
            });
            onPrimaryChange(supplierId);
            return;
        }

        setActionLoading(`primary-${supplierId}`);
        try {
            await suppliersAdminService.setPrimarySupplier(productId, supplierId);
            onPrimaryChange(supplierId);
            loadLinks();
        } finally {
            setActionLoading(null);
        }
    }

    async function handleRemove(supplierId: string) {
        if (!productId) return;
        if (!confirm('¿Deseas remover este proveedor del producto?')) return;
        setActionLoading(`remove-${supplierId}`);
        try {
            await suppliersAdminService.removeProductSupplier(productId, supplierId);
            if (primarySupplierId === supplierId) onPrimaryChange(null);
            loadLinks();
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
        } catch (e) {
            console.error('Error al actualizar costo:', e);
        } finally {
            setUpdatingSupplier(null);
        }
    }

    return (
        <fieldset className={styles.fieldset}>
            {/* ── Dropdown de Proveedor Principal ── */}
            <legend className={styles.legend}>
                Proveedor Principal
            </legend>
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
                            <i className="bi bi-x-circle"></i>
                        </div>
                    )}
                    <i className={`bi bi-chevron-down ${styles.chevron} ${open ? styles.chevronOpen : ''}`}></i>
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
                                    {s.id === primarySupplierId && (
                                        <i className="bi bi-star-fill" style={{ color: 'var(--color-accent)', fontSize: '0.8rem' }}></i>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Card del Proveedor Principal ── */}
            {primaryLink && (
                <div className={styles.supplierCard}>
                    {linksLoading ? (
                        <div className={styles.cardLoading}>
                            <div className={styles.spinner}></div>
                            <span>Cargando datos del proveedor...</span>
                        </div>
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
                                    <span className={`${styles.statValue} ${primaryLink.cost && primaryLink.currentPrice
                                        ? (((primaryLink.currentPrice - primaryLink.cost) / (primaryLink.cost || 1)) * 100) < 10
                                            ? styles.statDanger
                                            : (((primaryLink.currentPrice - primaryLink.cost) / (primaryLink.cost || 1)) * 100) < 15
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
                                    <i className="bi bi-currency-dollar"></i> Actualizar Costo
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                                    onClick={() => setViewingHistory(primaryLink)}
                                >
                                    <i className="bi bi-graph-up-arrow"></i> Ver Histórico
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.cardLoading}>Proveedor asignado — sin datos de precio aún</div>
                    )}
                </div>
            )}

            {/* ── Tabla de Otros Proveedores ── */}
            {otherLinks.length > 0 && (
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
                                                    <i className="bi bi-currency-dollar" style={{ color: 'var(--color-primary)' }}></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.miniBtn}
                                                    disabled={actionLoading === `primary-${link.supplierId}`}
                                                    onClick={() => handleSetPrimary(link.supplierId)}
                                                    title="Establecer como principal"
                                                >
                                                    <i className="bi bi-star" style={{ color: 'var(--color-accent)' }}></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                                                    disabled={actionLoading === `remove-${link.supplierId}`}
                                                    onClick={() => handleRemove(link.supplierId)}
                                                    title="Remover proveedor"
                                                >
                                                    <i className="bi bi-trash" style={{ color: 'var(--color-error)' }}></i>
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

            {/* ── Modales ── */}
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
        </fieldset>
    );
}