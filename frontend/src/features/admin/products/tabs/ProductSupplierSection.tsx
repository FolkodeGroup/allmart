import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    suppliersAdminService,
    type AdminSupplierV2,
    type ProductSupplierEntry,
} from '../../suppliers/suppliersAdminService';
import { PriceUpdateModal } from '../../suppliers/PriceUpdateModal';
import { PriceHistoryModal } from '../../suppliers/PriceHistoryModal';
import { ModalConfirm } from '../../../../components/ui/ModalConfirm/ModalConfirm';
import { Award, Zap, Star, Clock, DollarSign, Plus, Trash2, Edit3, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './ProductSupplierSection.module.css';

const fmt = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
});

interface ProductSupplierSectionProps {
    productId: string | null;          // null = modo creación
    productName?: string;
    currentProductPrice?: number;      // precio venta público
    primarySupplierId: string | null | undefined;
    onPrimaryChange: (id: string | null) => void;
}

// Convierte Lead Time a horas para comparación precisa
function toHours(val: number | null | undefined, unit: string | null | undefined): number {
    if (!val || val <= 0) return 72; // fallback 3 días
    const u = (unit ?? 'dias').toLowerCase();
    if (u === 'horas' || u === 'hs') return val;
    return val * 24; // días a horas
}

export function ProductSupplierSection({
    productId,
    productName = '',
    currentProductPrice = 0,
    primarySupplierId,
    onPrimaryChange,
}: ProductSupplierSectionProps) {
    // ── Todos los proveedores activos (para vincular nuevos) ──
    const [allSuppliers, setAllSuppliers] = useState<AdminSupplierV2[]>([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);

    // ── Vínculos actuales de este producto ──
    const [productLinks, setProductLinks] = useState<ProductSupplierEntry[]>([]);
    const [linksLoading, setLinksLoading] = useState(false);

    // ── Estado del Acordeón ──
    const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

    // ── Estado del Dropdown de asignación ──
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── Modales ──
    const [updatingSupplier, setUpdatingSupplier] = useState<ProductSupplierEntry | null>(null);
    const [viewingHistory, setViewingHistory] = useState<ProductSupplierEntry | null>(null);
    const [deleteConfirmSupplierId, setDeleteConfirmSupplierId] = useState<string | null>(null);

    // ── Cargas en progreso ──
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Cargar catálogo de proveedores
    useEffect(() => {
        setSuppliersLoading(true);
        suppliersAdminService.listSuppliers({ limit: 200, isActive: true })
            .then(res => setAllSuppliers(res.data))
            .catch(() => setAllSuppliers([]))
            .finally(() => setSuppliersLoading(false));
    }, []);

    // Cargar relaciones del producto
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

    // Desplegar por defecto el Proveedor Principal o el primero
    useEffect(() => {
        if (productLinks.length > 0 && !expandedSupplierId) {
            const primary = productLinks.find(l => l.isPrimary || l.supplierId === primarySupplierId);
            setExpandedSupplierId(primary?.supplierId ?? productLinks[0].supplierId);
        }
    }, [productLinks, primarySupplierId, expandedSupplierId]);

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

    // ── Cálculo Inteligente de Recomendaciones Multiproveedor ──
    const { minCostSupplierId, fastestSupplierId } = useMemo(() => {
        if (productLinks.length === 0) return { minCostSupplierId: null, fastestSupplierId: null };

        let lowestCost = Infinity;
        let lowestCostId: string | null = null;

        let fastestHours = Infinity;
        let fastestId: string | null = null;

        productLinks.forEach(link => {
            if (link.cost !== null && link.cost > 0) {
                if (link.cost < lowestCost) {
                    lowestCost = link.cost;
                    lowestCostId = link.supplierId;
                }
            }

            const hours = toHours(link.leadTimeValue, link.leadTimeUnit);
            if (hours < fastestHours) {
                fastestHours = hours;
                fastestId = link.supplierId;
            }
        });

        return {
            minCostSupplierId: lowestCostId,
            fastestSupplierId: fastestId,
        };
    }, [productLinks]);

    // Filtrar proveedores no vinculados para el selector
    const unlinkedSuppliers = useMemo(() => {
        const linkedIds = new Set(productLinks.map(l => l.supplierId));
        return allSuppliers.filter(s => !linkedIds.has(s.id) && (!search || s.name.toLowerCase().includes(search.toLowerCase())));
    }, [allSuppliers, productLinks, search]);

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
            leadTimeValue: 3,
            leadTimeUnit: 'dias',
            isActive: true,
            isPrimary: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    // ── Handlers ──
    async function handleAssignSupplier(supplierId: string) {
        setOpen(false);
        setSearch('');

        if (!productId) {
            setProductLinks(prev => {
                const isFirst = prev.length === 0;
                const newLink = { ...createLocalLink(supplierId), isPrimary: isFirst };
                if (isFirst) onPrimaryChange(supplierId);
                return [...prev, newLink];
            });
            setExpandedSupplierId(supplierId);
            return;
        }

        setActionLoading(`assign-${supplierId}`);
        try {
            await suppliersAdminService.assignSupplier(productId, {
                supplierId,
                currentPrice: currentProductPrice || 1,
                leadTimeValue: 3,
                leadTimeUnit: 'dias',
                changeReason: 'regular',
            });
            if (!primarySupplierId) {
                await suppliersAdminService.setPrimarySupplier(productId, supplierId);
                onPrimaryChange(supplierId);
            }
            setExpandedSupplierId(supplierId);
            loadLinks();
        } finally {
            setActionLoading(null);
        }
    }

    async function handleSetPrimary(supplierId: string) {
        if (!productId) {
            setProductLinks(prev => prev.map(l => ({ ...l, isPrimary: l.supplierId === supplierId })));
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
        if (!productId) {
            setProductLinks(prev => {
                const next = prev.filter(l => l.supplierId !== supplierId);
                if (primarySupplierId === supplierId) {
                    const nextPrimary = next[0]?.supplierId ?? null;
                    onPrimaryChange(nextPrimary);
                }
                return next;
            });
            return;
        }
        // Confirmation handled by ModalConfirm wrapper; proceed to delete
        setActionLoading(`remove-${supplierId}`);
        try {
            await suppliersAdminService.removeProductSupplier(productId, supplierId);
            if (primarySupplierId === supplierId) {
                const remaining = productLinks.filter(l => l.supplierId !== supplierId);
                onPrimaryChange(remaining[0]?.supplierId ?? null);
            }
            loadLinks();
        } finally {
            setActionLoading(null);
        }
    }

    async function handlePriceSave(data: { cost: number; leadTimeValue: number; leadTimeUnit: string; changeReason: string }) {
        if (!updatingSupplier) return;

        if (!productId) {
            setProductLinks(prev => prev.map(l => {
                if (l.supplierId === updatingSupplier.supplierId) {
                    const priceNum = currentProductPrice || 1;
                    const marginVal = data.cost > 0 ? ((priceNum - data.cost) / data.cost) * 100 : null;
                    return {
                        ...l,
                        cost: data.cost,
                        leadTimeValue: data.leadTimeValue,
                        leadTimeUnit: data.leadTimeUnit,
                        margin: marginVal,
                    };
                }
                return l;
            }));
            setUpdatingSupplier(null);
            return;
        }

        try {
            await suppliersAdminService.updateProductSupplierPrice(productId, updatingSupplier.supplierId, {
                cost: data.cost,
                leadTimeValue: data.leadTimeValue,
                leadTimeUnit: data.leadTimeUnit,
                changeReason: data.changeReason,
            });
            loadLinks();
        } catch (e) {
            console.error('Error al actualizar condiciones:', e);
        } finally {
            setUpdatingSupplier(null);
        }
    }

    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
                Matriz de Proveedores y Suministro
            </legend>

            <p className={styles.sectionHint}>
                Administrá los proveedores vinculados. Hacé clic en cualquier tarjeta para desplegar sus métricas y acciones.
            </p>

            {/* ── Buscador/Selector para agregar proveedores ── */}
            <div className={styles.addSupplierWrapper} ref={dropdownRef}>
                <button
                    type="button"
                    className={styles.addTriggerBtn}
                    onClick={() => setOpen(v => !v)}
                    disabled={suppliersLoading}
                >
                    <Plus size={16} />
                    <span>Asignar otro proveedor a este producto</span>
                    <ChevronDown size={16} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
                </button>

                {open && (
                    <div className={styles.dropdownPanel}>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar proveedor disponible..."
                                className={styles.searchInput}
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                            />
                        </div>
                        <div className={styles.optionsList}>
                            {unlinkedSuppliers.length === 0 ? (
                                <div className={styles.noOptions}>
                                    {search ? 'Sin coincidencias' : 'Todos los proveedores ya están asignados.'}
                                </div>
                            ) : unlinkedSuppliers.map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={styles.optionItem}
                                    onClick={() => handleAssignSupplier(s.id)}
                                >
                                    <span className={styles.optionName}>{s.name}</span>
                                    <span className={styles.optionMeta}>{s.phone}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Lista Acordeón de Tarjetas de Proveedores ── */}
            {linksLoading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <span>Cargando matriz de suministro...</span>
                </div>
            ) : productLinks.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>Este producto aún no tiene proveedores asignados. Usá el botón de arriba para vincular el primero.</p>
                </div>
            ) : (
                <div className={styles.matrixGrid}>
                    {productLinks.map(link => {
                        const isPrimary = link.isPrimary || link.supplierId === primarySupplierId;
                        const isBestCost = link.supplierId === minCostSupplierId && link.cost !== null;
                        const isFastest = link.supplierId === fastestSupplierId;
                        const isExpanded = expandedSupplierId === link.supplierId;

                        const marginVal = link.cost && currentProductPrice > 0
                            ? ((currentProductPrice - link.cost) / link.cost) * 100
                            : (link.margin ?? null);

                        return (
                            <div
                                key={link.supplierId}
                                className={`${styles.supplierCard} ${isPrimary ? styles.cardPrimary : ''} ${isExpanded ? styles.cardExpanded : ''}`}
                            >
                                {/* Cabecera Clickeable del Acordeón */}
                                <div
                                    className={styles.cardHeader}
                                    onClick={() => setExpandedSupplierId(isExpanded ? null : link.supplierId)}
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={isExpanded}
                                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpandedSupplierId(isExpanded ? null : link.supplierId)}
                                >
                                    <div className={styles.supplierTitleGroup}>
                                        <span className={styles.supplierAvatar}>{link.supplierName.charAt(0).toUpperCase()}</span>
                                        <div className={styles.titleTextWrapper}>
                                            <div className={styles.nameAndBadges}>
                                                <h4 className={styles.supplierName}>{link.supplierName}</h4>
                                                <div className={styles.badgesGroup}>
                                                    {isPrimary && (
                                                        <span className={`${styles.badge} ${styles.badgePrimary}`} title="Proveedor predeterminado">
                                                            <Star size={11} /> Principal
                                                        </span>
                                                    )}
                                                    {isBestCost && (
                                                        <span className={`${styles.badge} ${styles.badgeCost}`} title="Menor costo de compra">
                                                            <Award size={11} /> Mejor Costo
                                                        </span>
                                                    )}
                                                    {isFastest && (
                                                        <span className={`${styles.badge} ${styles.badgeSpeed}`} title="Tiempo de entrega más rápido">
                                                            <Zap size={11} /> Más Rápido
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={styles.supplierPhone}>
                                                {link.supplierPhone || link.supplierEmail || 'Sin contacto'}
                                                {!isExpanded && link.cost && ` · Costo: $${link.cost.toLocaleString('es-AR')}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.headerRight}>
                                        <span className={styles.expandChevron}>
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </span>
                                    </div>
                                </div>

                                {/* Cuerpo Expandible con KPIs y Botones */}
                                {isExpanded && (
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardKpiGrid}>
                                            <div className={styles.kpiBox}>
                                                <span className={styles.kpiLabel}><DollarSign size={11} /> Costo Reposición</span>
                                                <span className={`${styles.kpiValue} ${styles.costText}`}>
                                                    {link.cost ? fmt.format(link.cost) : '—'}
                                                </span>
                                            </div>

                                            <div className={styles.kpiBox}>
                                                <span className={styles.kpiLabel}><Clock size={11} /> Lead Time</span>
                                                <span className={styles.kpiValue}>
                                                    {link.leadTimeValue ? `${link.leadTimeValue} ${link.leadTimeUnit ?? 'días'}` : '3 días'}
                                                </span>
                                            </div>

                                            <div className={styles.kpiBox}>
                                                <span className={styles.kpiLabel}>Margen Est.</span>
                                                <span className={`${styles.kpiValue} ${marginVal && marginVal < 15 ? styles.marginLow : styles.marginOk}`}>
                                                    {marginVal !== null && marginVal !== undefined ? `${marginVal.toFixed(1)}%` : '—'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.cardActions}>
                                            <button
                                                type="button"
                                                className={styles.btnAction}
                                                onClick={(e) => { e.stopPropagation(); setUpdatingSupplier(link); }}
                                                title="Actualizar costo y tiempo de entrega"
                                            >
                                                <Edit3 size={13} /> Condiciones
                                            </button>

                                            {productId && (
                                                <button
                                                    type="button"
                                                    className={`${styles.btnAction} ${styles.btnGhost}`}
                                                    onClick={(e) => { e.stopPropagation(); setViewingHistory(link); }}
                                                    title="Ver historial de cambios"
                                                >
                                                    <Clock size={13} /> Historial
                                                </button>
                                            )}

                                            {!isPrimary && (
                                                <button
                                                    type="button"
                                                    className={`${styles.btnAction} ${styles.btnPrimary}`}
                                                    onClick={(e) => { e.stopPropagation(); handleSetPrimary(link.supplierId); }}
                                                    disabled={actionLoading === `primary-${link.supplierId}`}
                                                >
                                                    <CheckCircle2 size={13} /> Asignar Principal
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className={`${styles.btnAction} ${styles.btnDanger}`}
                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmSupplierId(link.supplierId); }}
                                                disabled={actionLoading === `remove-${link.supplierId}`}
                                                title="Desvincular del producto"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modales ── */}
            {updatingSupplier && (
                <PriceUpdateModal
                    productName={productName || updatingSupplier.supplierName}
                    currentPrice={currentProductPrice}
                    currentCost={updatingSupplier.cost}
                    currentLeadTimeValue={updatingSupplier.leadTimeValue}
                    currentLeadTimeUnit={updatingSupplier.leadTimeUnit}
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

            <ModalConfirm
                open={deleteConfirmSupplierId !== null}
                title="Desvincular proveedor"
                message="¿Estás seguro de que querés desvincular este proveedor del producto? Esta acción puede revertirse agregando el proveedor nuevamente."
                confirmText="Desvincular"
                cancelText="Cancelar"
                onConfirm={async () => {
                    if (deleteConfirmSupplierId) {
                        await handleRemove(deleteConfirmSupplierId);
                        setDeleteConfirmSupplierId(null);
                    }
                }}
                onCancel={() => setDeleteConfirmSupplierId(null)}
            />
        </fieldset>
    );
}