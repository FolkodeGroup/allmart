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
            setProductLinks(prev => prev.map(link => (
                link.supplierId === updatingSupplier.supplierId
                    ? { ...link, cost: data.cost }
                    : link
            )));
            loadLinks();
        } catch (e) {
            console.error('Error al actualizar costo:', e);
        }
    }

    function renderAssignedSuppliersTable() {
        return (
            <div className={styles.modalAssignedSection}>
                <div className={styles.otherTitle}>Proveedores Asignados</div>
                <div className={styles.otherTable}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Proveedor</th>
                                <th>Precio</th>
                                <th>Costo</th>
                                <th>Margen</th>
                                <th>Principal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productLinks.map(link => (
                                <tr key={link.supplierId}>
                                    <td>{link.supplierName}</td>
                                    <td>{fmt.format(link.currentPrice)}</td>
                                    <td>{link.cost != null ? fmt.format(link.cost) : '—'}</td>
                                    <td>
                                        {link.cost != null && link.currentPrice > 0
                                            ? `${(((link.currentPrice - link.cost) / link.cost) * 100).toFixed(1)}%`
                                            : '—'}
                                    </td>
                                    <td>{link.isPrimary ? 'Sí' : '—'}</td>
                                    <td>
                                        <div className={styles.rowActions}>
                                            <button
                                                type="button"
                                                className={`${styles.iconBtn} ${link.isPrimary ? styles.iconBtnActive : ''}`}
                                                onClick={() => handleSetPrimary(link.supplierId)}
                                                aria-label={`Marcar ${link.supplierName} como principal`}
                                                disabled={!!actionLoading}
                                            >
                                                <i className={`bi ${link.isPrimary ? 'bi-star-fill' : 'bi-star'}`} />
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.iconBtn}
                                                onClick={() => handleRemove(link.supplierId)}
                                                aria-label={`Remover proveedor ${link.supplierName}`}
                                                disabled={!!actionLoading}
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div>
            <style>{`
                /* Mejoras específicas para el dropdown en móvil */
                @media (max-width: 767px) {
                    .supplierDropdownMobile {
                        position: relative;
                        width: 100%;
                    }
                    .supplierDropdownListMobile {
                        position: absolute;
                        top: calc(100% + 4px);
                        left: 0;
                        right: 0;
                        z-index: 150;
                        background: var(--color-bg-primary, #1f2937);
                        border: 1px solid var(--color-border, #4b5563);
                        border-radius: 8px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                        max-height: 280px;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    .supplierSearchBoxMobile {
                        padding: 10px;
                        border-bottom: 1px solid var(--color-border, #374151);
                        background: var(--color-bg-secondary, #28353d);
                        position: sticky;
                        top: 0;
                        z-index: 2;
                    }
                    .supplierSearchInputMobile {
                        width: 100%;
                        min-height: 44px;
                        background: var(--color-bg-primary, #111827);
                        border: 1px solid var(--color-border, #4b5563);
                        border-radius: 6px;
                        padding: 0 12px;
                        color: var(--color-text-primary, #ffffff);
                        font-size: 16px;
                        box-sizing: border-box;
                    }
                    .supplierSearchInputMobile:focus {
                        outline: none;
                        border-color: var(--color-primary);
                    }
                    .supplierOptionsMobile {
                        overflow-y: auto;
                        flex: 1;
                        -webkit-overflow-scrolling: touch;
                    }
                    .supplierOptionMobile {
                        min-height: 48px;
                        padding: 12px 16px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        color: var(--color-text-primary, #f3f4f6);
                        font-size: 15px;
                        background: transparent;
                        border-left: none;
                        border-right: none;
                        border-top: none;
                        width: 100%;
                        text-align: left;
                        cursor: pointer;
                    }
                    .supplierOptionMobile:active {
                        background: rgba(255,255,255,0.05);
                    }
                    .supplierOptionNoneMobile {
                        color: var(--color-text-secondary, #9ca3af);
                        font-style: italic;
                    }
                }
            `}</style>

            <div className={`${styles.dropdown} supplierDropdownMobile`} ref={dropdownRef}>
                <button
                    id="primary-supplier-select"
                    type="button"
                    className={styles.dropdownTrigger}
                    onClick={() => setOpen(v => !v)}
                    disabled={suppliersLoading || actionLoading === 'select'}
                    style={{ minHeight: '44px' }}
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
                            style={{ minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <i className="bi bi-x-circle"></i>
                        </div>
                    )}
                    <i className={`bi bi-chevron-down ${styles.chevron} ${open ? styles.chevronOpen : ''}`}></i>
                </button>
                {open && (
                    <div className={`${styles.dropdownList} supplierDropdownListMobile`}>
                        <div className={`${styles.searchBox} supplierSearchBoxMobile`}>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar proveedor..."
                                className={`${styles.searchInput} supplierSearchInputMobile`}
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                            />
                        </div>
                        <div className={`${styles.options} supplierOptionsMobile`}>
                            <button type="button" className={`${styles.option} supplierOptionMobile`} onClick={() => handleSelect(null)}>
                                <span className={`${styles.optionNone} supplierOptionNoneMobile`}>— Sin proveedor —</span>
                            </button>
                            {filtered.length === 0 ? (
                                <div className={styles.noOptions} style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>Sin resultados</div>
                            ) : filtered.map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`${styles.option} supplierOptionMobile ${s.id === primarySupplierId ? styles.optionActive : ''}`}
                                    onClick={() => handleSelect(s.id)}
                                >
                                    <span className={styles.optionName}>{s.name}</span>
                                    {s.id === primarySupplierId && (
                                        <i className="bi bi-star-fill" style={{ color: 'var(--color-accent)', fontSize: '1rem' }}></i>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.assignedSection}>
                <div className={styles.assignedHeader}>
                    <div>
                        <div className={styles.assignedTitle}>Proveedores asignados</div>
                        <div className={styles.assignedDescription}>Haz click en un proveedor para actualizar su costo.</div>
                    </div>
                    {linksLoading && <span className={styles.loadingLabel}>Cargando...</span>}
                </div>

                {linksLoading && productLinks.length === 0 ? (
                    <div className={styles.cardLoading}>
                        <div className={styles.spinner}></div>
                        <span>Cargando proveedores asignados...</span>
                    </div>
                ) : productLinks.length > 0 ? (
                    <div className={styles.cardsGrid}>
                        {productLinks.map(link => {
                            const marginValue = link.cost != null && link.currentPrice > 0
                                ? `${(((link.currentPrice - link.cost) / link.cost) * 100).toFixed(1)}%`
                                : '—';
                            return (
                                <button
                                    key={link.supplierId}
                                    type="button"
                                    className={`${styles.supplierCardButton} ${link.isPrimary ? styles.supplierCardPrimary : ''}`}
                                    onClick={() => setUpdatingSupplier(link)}
                                    aria-label={`Abrir modal de actualización de costo para ${link.supplierName}`}
                                >
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardTitle}>{link.supplierName}</span>
                                        {link.isPrimary && <span className={styles.cardBadge}>Principal</span>}
                                    </div>
                                    <div className={styles.cardStats}>
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>Precio actual</span>
                                            <span className={styles.statValue}>{fmt.format(link.currentPrice)}</span>
                                        </div>
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>Costo</span>
                                            <span className={styles.statValue}>{link.cost != null ? fmt.format(link.cost) : '—'}</span>
                                        </div>
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>Margen</span>
                                            <span className={styles.statValue}>{marginValue}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.emptyState}>No hay proveedores asignados para este producto.</div>
                )}
            </div>

            {/* ── Modales ── */}
            {updatingSupplier && (
                <PriceUpdateModal
                    key={updatingSupplier.supplierId}
                    productName={productName || updatingSupplier.supplierName}
                    currentPrice={updatingSupplier.currentPrice}
                    currentCost={updatingSupplier.cost}
                    onClose={() => setUpdatingSupplier(null)}
                    onSave={handlePriceSave}
                    closeOnSave={false}
                >
                    {renderAssignedSuppliersTable()}
                </PriceUpdateModal>
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