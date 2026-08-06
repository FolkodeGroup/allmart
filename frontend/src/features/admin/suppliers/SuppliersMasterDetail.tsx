import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Globe, Phone, Package, Mail, CheckCircle, XCircle, TrendingUp, Table, BarChart2, AlertTriangle, Clock } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar,
} from 'recharts';
import {
    suppliersAdminService,
    type AdminSupplierV2,
    type SupplierProductEntry,
    type PriceHistoryEntry,
} from './suppliersAdminService';
import { PriceHistoryModal } from './PriceHistoryModal';
import { PriceUpdateModal } from './PriceUpdateModal';
import styles from './SuppliersMasterDetail.module.css';

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const fmtN = (v: number | null) => (v === null ? '—' : fmt.format(v));
const fmtPct = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`);
const fmtCompact = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
    maximumFractionDigits: 1,
});

function fmtDateShort(iso: string) {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
}

function daysAgoISO(days: number) {
    const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10);
}

type TabId = 'table' | 'chart' | 'analysis';
type RangeId = 7 | 30 | 90;

interface SuppliersMasterDetailProps {
    onNew: () => void;
    onEdit: (id: string) => void;
}

function useIsMobile(breakpoint = 480) {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
    );

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [breakpoint]);

    return isMobile;
}

export function SuppliersMasterDetail({ onNew, onEdit }: SuppliersMasterDetailProps) {
    const [suppliers, setSuppliers] = useState<AdminSupplierV2[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState<'active' | 'inactive'>('active');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const isMobile = useIsMobile();

    // Right panel state
    const [activeTab, setActiveTab] = useState<TabId>('table');
    const [products, setProducts] = useState<SupplierProductEntry[]>([]);
    const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
    const [rightLoading, setRightLoading] = useState(false);
    const [rangedays, setRangeDays] = useState<RangeId>(30);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    // Modals
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [historyProduct, setHistoryProduct] = useState<{ productId: string; productName: string } | null>(null);
    const [updatingSupplier, setUpdatingSupplier] = useState<SupplierProductEntry | null>(null);

    // Sort & Bulk Selection for Table
    const [sortKey, setSortKey] = useState<keyof SupplierProductEntry>('productName');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

    // ── Load suppliers ──────────────────────────────────────────────────────
    const loadSuppliers = useCallback(async () => {
        setLoadingList(true);
        try {
            const result = await suppliersAdminService.listSuppliers({ limit: 200 });
            setSuppliers(result?.data ?? []);
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

    useEffect(() => {
        if (!selectedId && suppliers.length > 0) {
            setSelectedId(suppliers[0].id);
        }
    }, [suppliers, selectedId]);

    // ── Load right panel data ───────────────────────────────────────────────
    const loadRightData = useCallback(() => {
        if (!selectedId) return;
        setRightLoading(true);
        const startDate = daysAgoISO(rangedays);
        Promise.all([
            suppliersAdminService.getSupplierProducts(selectedId),
            suppliersAdminService.getSupplierPriceHistory(selectedId, { startDate }),
        ]).then(([prods, hist]) => {
            setProducts(prods);
            setHistory(hist);
        }).catch(() => {
            setProducts([]);
            setHistory([]);
        }).finally(() => setRightLoading(false));
    }, [selectedId, rangedays]);

    useEffect(() => {
        loadRightData();
    }, [loadRightData]);

    useEffect(() => {
        setBulkSelectedIds([]);
    }, [selectedId]);

    const filteredSuppliers = useMemo(() => {
        let list = suppliers;
        list = filterTab === 'active' ? list.filter(s => s.isActive) : list.filter(s => !s.isActive);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                (s.email ?? '').toLowerCase().includes(q) ||
                s.phone.toLowerCase().includes(q)
            );
        }
        return list;
    }, [suppliers, search, filterTab]);

    const selectedSupplier = useMemo(() => suppliers.find(s => s.id === selectedId) ?? null, [suppliers, selectedId]);

    // ── Chart data for Fluctuación ──────────────────────────────────────────
    const chartHistory = useMemo(() => {
        if (selectedProductIds.length === 0) return history;
        return history.filter(h => selectedProductIds.includes(h.productId));
    }, [history, selectedProductIds]);

    const chartData = useMemo(() => {
        if (chartHistory.length === 0) return [];
        const byDate: Record<string, Record<string, number>> = {};
        chartHistory.forEach(h => {
            const day = h.createdAt.slice(0, 10);
            if (!byDate[day]) byDate[day] = {};
            byDate[day][h.productName] = h.cost !== null ? h.cost : h.price;
        });
        const sorted = Object.keys(byDate).sort();
        return sorted.map(day => ({ date: day, ...byDate[day] }));
    }, [chartHistory]);

    const chartProducts = useMemo(() => {
        const names = new Set<string>();
        chartHistory.forEach(h => names.add(h.productName));
        return Array.from(names).slice(0, 6);
    }, [chartHistory]);

    const LINE_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6'];

    // ── Table Filtering & Bulk Selection ────────────────────────────────────
    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return products;
        return products.filter(p => {
            const haystack = `${p.productName} ${p.sku ?? ''}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [products, productSearch]);

    const sortedProducts = useMemo(() => {
        return [...filteredProducts].sort((a, b) => {
            const va = a[sortKey] ?? 0;
            const vb = b[sortKey] ?? 0;
            if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(String(vb)) : String(vb).localeCompare(va);
            return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
        });
    }, [filteredProducts, sortKey, sortDir]);

    function toggleSort(key: keyof SupplierProductEntry) {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    }

    function toggleBulkSelect(productId: string) {
        setBulkSelectedIds(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    }

    function toggleSelectAllBulk() {
        const visibleIds = filteredProducts.map(p => p.productId);
        const allSelected = visibleIds.every(id => bulkSelectedIds.includes(id));
        if (allSelected) {
            setBulkSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setBulkSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
        }
    }

    function toggleChartProduct(productId: string) {
        setSelectedProductIds(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    }

    // ── Analysis metrics ────────────────────────────────────────────────────
    const analysisMetrics = useMemo(() => {
        const margins = products.filter(p => p.margin !== null).map(p => p.margin as number);
        const avgMargin = margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : null;
        const prices = products.map(p => p.currentPrice);
        const mean = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
        const variance = prices.length ? prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length : 0;
        const volatility = Math.sqrt(variance);
        const recentChanges = history.filter(h => {
            const d = new Date(h.createdAt);
            return (Date.now() - d.getTime()) < 24 * 3600 * 1000;
        }).length;
        const topByMargin = [...products]
            .filter(p => p.margin !== null)
            .sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))
            .slice(0, 3);
        const lowMarginAlerts = products.filter(p => p.margin !== null && (p.margin as number) < 15);
        return { avgMargin, volatility, recentChanges, topByMargin, lowMarginAlerts };
    }, [products, history]);

    // ── CSV Export ──────────────────────────────────────────────────────────
    function exportCsv() {
        const listToExport = bulkSelectedIds.length > 0
            ? products.filter(p => bulkSelectedIds.includes(p.productId))
            : products;

        const header = ['SKU', 'Producto', 'Precio Venta', 'Costo', 'Margen %', 'Entrega', 'Cambio 7d %', 'Última actualización'];
        const rows = listToExport.map(p => [
            p.sku ?? '',
            p.productName,
            p.currentPrice,
            p.cost ?? '',
            p.margin ?? '',
            p.leadTimeValue ? `${p.leadTimeValue} ${p.leadTimeUnit ?? 'días'}` : '3 días',
            p.priceChangePercent ?? '',
            p.lastPriceChange ? new Date(p.lastPriceChange).toLocaleDateString('es-AR') : '',
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'productos-proveedor.csv'; a.click();
        URL.revokeObjectURL(url);
    }

    // ── Toggle Active/Inactive ─────────────────────────────────────────────
    async function confirmDelete() {
        if (!deleteId) return;
        try {
            const supplier = suppliers.find(s => s.id === deleteId);
            if (!supplier) return;

            if (supplier.isActive) {
                await suppliersAdminService.deleteSupplierV2(deleteId);
            } else {
                await suppliersAdminService.updateSupplierV2(deleteId, { name: supplier.name, isActive: true });
            }
            if (selectedId === deleteId) setSelectedId(null);
            await loadSuppliers();
        } finally {
            setDeleteId(null);
        }
    }

    // ── Save Conditions ─────────────────────────────────────────────────────
    async function handleSaveConditions(data: { cost: number; leadTimeValue: number; leadTimeUnit: string; changeReason: string }) {
        if (!selectedId || !updatingSupplier) return;
        await suppliersAdminService.updateProductSupplierPrice(updatingSupplier.productId, selectedId, {
            cost: data.cost,
            leadTimeValue: data.leadTimeValue,
            leadTimeUnit: data.leadTimeUnit,
            changeReason: data.changeReason,
        });
        loadRightData();
    }

    // ── Render helpers ──────────────────────────────────────────────────────
    function getMarginBadge(margin: number | null) {
        if (margin === null) return null;
        if (margin < 10) return <span className={`${styles.badge} ${styles.badgeDanger}`}>🔴 {margin.toFixed(1)}%</span>;
        if (margin < 15) return <span className={`${styles.badge} ${styles.badgeWarn}`}>🟠 {margin.toFixed(1)}%</span>;
        return <span className={`${styles.badge} ${styles.badgeOk}`}>{margin.toFixed(1)}%</span>;
    }

    return (
        <div className={styles.layout}>
            {/* ── LEFT COLUMN ── */}
            <aside className={styles.leftCol}>
                <div className={styles.leftHeader}>
                    <div className={styles.searchRow}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Buscar proveedor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoComplete="off"
                            spellCheck="false"
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                    </div>
                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${filterTab === 'active' ? styles.filterTabActive : ''}`}
                            onClick={() => setFilterTab('active')}
                            type="button"
                        >
                            Activos
                        </button>
                        <button
                            className={`${styles.filterTab} ${filterTab === 'inactive' ? styles.filterTabActive : ''}`}
                            onClick={() => setFilterTab('inactive')}
                            type="button"
                        >
                            Inactivos
                        </button>
                    </div>
                    <button className={styles.newBtn} onClick={onNew} type="button">
                        <Plus size={14} /> Nuevo proveedor
                    </button>
                </div>

                <div className={styles.supplierList}>
                    {loadingList ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={styles.supplierSkeleton} />
                        ))
                    ) : filteredSuppliers.length === 0 ? (
                        <div className={styles.emptyList}>No se encontraron proveedores</div>
                    ) : (
                        filteredSuppliers.map(s => (
                            <div
                                key={s.id}
                                className={`${styles.supplierCard} ${selectedId === s.id ? styles.supplierCardActive : ''}`}
                                onClick={() => setSelectedId(s.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && setSelectedId(s.id)}
                            >
                                <div className={styles.cardTop}>
                                    <span className={styles.avatar}>{s.name.charAt(0).toUpperCase()}</span>
                                    <div className={styles.cardInfo}>
                                        <span className={styles.cardName}>{s.name}</span>
                                        <span className={styles.cardStatus}>
                                            {s.isActive
                                                ? <><CheckCircle size={10} color="var(--color-success, #10b981)" /> Activo</>
                                                : <><XCircle size={10} color="var(--color-error, #ef4444)" /> Inactivo</>
                                            }
                                        </span>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button className={styles.iconBtn} onClick={e => { e.stopPropagation(); onEdit(s.id); }} title="Editar">
                                            <i className="bi bi-pencil-fill" />
                                        </button>
                                        <button className={styles.iconBtn} onClick={e => { e.stopPropagation(); setDeleteId(s.id); }} title={s.isActive ? 'Desactivar proveedor' : 'Reactivar proveedor'}>
                                            <i className={s.isActive ? 'bi bi-lightbulb-off' : 'bi bi-lightbulb'} />
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.cardMeta}>
                                    {s.email && <span><Mail size={11} />{s.email}</span>}
                                    {s.phone && <span><Phone size={11} />{s.phone}</span>}
                                    <span><Package size={11} />{s.productCount} producto{s.productCount !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* ── RIGHT COLUMN ── */}
            <section className={styles.rightCol}>
                {!selectedSupplier ? (
                    <div className={styles.noSelection}>
                        <Package size={40} className={styles.noSelectionIcon} />
                        <p>Seleccioná un proveedor para ver sus detalles</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.supplierHeader}>
                            <span className={styles.headerAvatar}>{selectedSupplier.name.charAt(0).toUpperCase()}</span>
                            <div>
                                <h3 className={styles.headerName}>{selectedSupplier.name}</h3>
                                <div className={styles.headerMeta}>
                                    {selectedSupplier.email && <span><Mail size={12} />{selectedSupplier.email}</span>}
                                    {selectedSupplier.phone && <span><Phone size={12} />{selectedSupplier.phone}</span>}
                                    {selectedSupplier.url && (
                                        <a href={selectedSupplier.url} target="_blank" rel="noopener noreferrer" className={styles.metaLink}>
                                            <Globe size={12} />{selectedSupplier.url.replace(/^https?:\/\//, '')}
                                        </a>
                                    )}
                                </div>
                                {selectedSupplier.description && (
                                    <p className={styles.headerDesc}>{selectedSupplier.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className={styles.tabs}>
                            {(['table', 'chart', 'analysis'] as TabId[]).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab(t)}
                                >
                                    {t === 'table' && <><Table size={13} /> Productos</>}
                                    {t === 'chart' && <><TrendingUp size={13} /> Fluctuación</>}
                                    {t === 'analysis' && <><BarChart2 size={13} /> Análisis</>}
                                </button>
                            ))}
                        </div>

                        {rightLoading ? (
                            <div className={styles.rightLoading}>
                                <div className={styles.spinner} />
                                <span>Cargando datos...</span>
                            </div>
                        ) : (
                            <div className={styles.tabContent}>
                                {/* ── TAB: TABLE (PRODUCTOS & ENTREGAS) ── */}
                                {activeTab === 'table' && (
                                    <div className={styles.tableTab}>
                                        <div className={styles.tableActions}>
                                            <div className={styles.tableToolbarLeft}>
                                                <label className={styles.searchBox}>
                                                    <Search size={14} />
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar producto o SKU..."
                                                        value={productSearch}
                                                        onChange={e => setProductSearch(e.target.value)}
                                                    />
                                                </label>
                                                <span className={styles.tableCount}>{filteredProducts.length} de {products.length} producto{products.length !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className={styles.tableToolbarRight}>
                                                <button type="button" className={styles.exportBtn} onClick={exportCsv}>
                                                    {bulkSelectedIds.length > 0 ? `Exportar Selección (${bulkSelectedIds.length})` : 'Exportar CSV'}
                                                </button>
                                            </div>
                                        </div>

                                        {products.length === 0 ? (
                                            <div className={styles.emptyTable}>Sin productos asignados a este proveedor</div>
                                        ) : (
                                            <div className={styles.tableWrapper}>
                                                <table className={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th className={styles.thCheckbox}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={filteredProducts.length > 0 && filteredProducts.every(p => bulkSelectedIds.includes(p.productId))}
                                                                    onChange={toggleSelectAllBulk}
                                                                    aria-label="Seleccionar todos los productos para acciones masivas"
                                                                />
                                                            </th>
                                                            {([
                                                                ['sku', 'SKU'],
                                                                ['productName', 'Nombre'],
                                                                ['currentPrice', 'Precio Venta'],
                                                                ['cost', 'Costo'],
                                                                ['margin', 'Margen %'],
                                                                ['leadTimeValue', 'Entrega'],
                                                                ['priceChangePercent', 'Cambio 7d'],
                                                                ['lastPriceChange', 'Última act.'],
                                                            ] as [keyof SupplierProductEntry, string][]).map(([key, label]) => (
                                                                <th key={key} onClick={() => toggleSort(key)} className={styles.thSortable}>
                                                                    {label} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                                                </th>
                                                            ))}
                                                            <th className={styles.thAction}>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sortedProducts.map(p => (
                                                            <tr
                                                                key={p.productId}
                                                                className={`${styles.tableRow} ${selectedProductId === p.productId ? styles.tableRowSelected : ''}`}
                                                                tabIndex={0}
                                                                onClick={() => setSelectedProductId(p.productId)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault();
                                                                        setSelectedProductId(p.productId);
                                                                    }
                                                                }}
                                                            >
                                                                <td className={styles.tdCheckbox} onClick={e => e.stopPropagation()}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={bulkSelectedIds.includes(p.productId)}
                                                                        onChange={() => toggleBulkSelect(p.productId)}
                                                                        aria-label={`Seleccionar ${p.productName} para acciones masivas`}
                                                                    />
                                                                </td>
                                                                <td className={styles.tdSku}>{p.sku ?? '—'}</td>
                                                                <td className={styles.tdName}>{p.productName}</td>
                                                                <td className={styles.tdPrice}>{fmtN(p.currentPrice)}</td>
                                                                <td className={styles.tdCost}>{p.cost ? fmtN(p.cost) : '—'}</td>
                                                                <td>{getMarginBadge(p.margin)}</td>
                                                                <td>
                                                                    <span className={styles.leadTimePill}>
                                                                        <Clock size={11} />
                                                                        {p.leadTimeValue ? `${p.leadTimeValue} ${p.leadTimeUnit ?? 'días'}` : '3 días'}
                                                                    </span>
                                                                </td>
                                                                <td className={p.priceChangePercent && p.priceChangePercent > 15 ? styles.tdWarn : ''}>
                                                                    {fmtPct(p.priceChangePercent)}
                                                                </td>
                                                                <td className={styles.tdDate}>
                                                                    {p.lastPriceChange ? new Date(p.lastPriceChange).toLocaleDateString('es-AR') : '—'}
                                                                </td>
                                                                <td className={styles.tdActions}>
                                                                    <div className={styles.actionBtnsGroup}>
                                                                        <button
                                                                            type="button"
                                                                            className={styles.miniBtn}
                                                                            onClick={e => { e.stopPropagation(); setUpdatingSupplier(p); }}
                                                                            title="Actualizar costo y tiempo de entrega"
                                                                        >
                                                                            <i className="bi bi-pencil-square" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className={styles.historyBtn}
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                setHistoryProduct({ productId: p.productId, productName: p.productName });
                                                                            }}
                                                                        >
                                                                            Historial
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── TAB: CHART (FLUCTUACIÓN DE COSTO PROVEEDOR) ── */}
                                {activeTab === 'chart' && (
                                    <div className={styles.chartTab}>
                                        <div className={styles.chartControls}>
                                            <span className={styles.controlLabel}>Período:</span>
                                            {([7, 30, 90] as RangeId[]).map(d => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    className={`${styles.rangeBtn} ${rangedays === d ? styles.rangeBtnActive : ''}`}
                                                    onClick={() => setRangeDays(d)}
                                                >
                                                    {d} días
                                                </button>
                                            ))}
                                        </div>

                                        {/* Selector directo de productos dentro de la pestaña de gráfico */}
                                        <div className={styles.chartFilterBar}>
                                            <span className={styles.controlLabel}>Comparar en gráfico:</span>
                                            <div className={styles.priorityPills}>
                                                {products.map(p => {
                                                    const isSelected = selectedProductIds.includes(p.productId);
                                                    return (
                                                        <button
                                                            key={p.productId}
                                                            type="button"
                                                            className={`${styles.priorityPill} ${isSelected ? styles.priorityPillActive : ''}`}
                                                            onClick={() => toggleChartProduct(p.productId)}
                                                        >
                                                            {p.productName}
                                                            {isSelected && <XCircle size={12} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {chartData.length === 0 ? (
                                            <div className={styles.emptyChart}>
                                                <TrendingUp size={36} />
                                                <p>Sin historial de fluctuación registrado para este proveedor en el período seleccionado.</p>
                                            </div>
                                        ) : (
                                            <div className={styles.chartPanel}>
                                                <ResponsiveContainer width="100%" height={isMobile ? 240 : 320}>
                                                    <LineChart
                                                        data={chartData}
                                                        margin={isMobile
                                                            ? { top: 12, right: 8, left: 0, bottom: 0 }
                                                            : { top: 20, right: 30, left: 20, bottom: 10 }
                                                        }>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #374151)" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tick={{ fontSize: isMobile ? 10 : 12, fill: '#9ca3af' }}
                                                            tickFormatter={isMobile ? fmtDateShort : undefined}
                                                            stroke="var(--color-text-tertiary, #6b7280)"
                                                        />
                                                        <YAxis
                                                            tick={{ fontSize: isMobile ? 10 : 12, fill: '#9ca3af' }}
                                                            tickFormatter={(v: number) => (isMobile ? fmtCompact : fmt).format(v)}
                                                            stroke="var(--color-text-tertiary, #6b7280)"
                                                            width={isMobile ? 42 : 90}
                                                        />
                                                        <Tooltip
                                                            formatter={(v: number, name: string) => [fmt.format(v), `Costo (${name})`]}
                                                            contentStyle={{
                                                                backgroundColor: '#1f2937',
                                                                border: '1px solid #374151',
                                                                borderRadius: 8,
                                                                color: '#fff',
                                                            }}
                                                        />
                                                        <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: isMobile ? 8 : 16 }} />
                                                        {chartProducts.map((name, i) => (
                                                            <Line
                                                                key={name}
                                                                type="monotone"
                                                                dataKey={name}
                                                                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                                                                strokeWidth={2.5}
                                                                dot={{ r: 4 }}
                                                                isAnimationActive={true}
                                                            />
                                                        ))}
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── TAB: ANALYSIS ── */}
                                {activeTab === 'analysis' && (
                                    <div className={styles.analysisTab}>
                                        <div className={styles.metricCards}>
                                            <div className={styles.metricCard}>
                                                <span className={styles.metricLabel}>Margen Promedio</span>
                                                <span className={styles.metricValue}>
                                                    {analysisMetrics.avgMargin !== null ? `${analysisMetrics.avgMargin.toFixed(1)}%` : '—'}
                                                </span>
                                            </div>
                                            <div className={styles.metricCard}>
                                                <span className={styles.metricLabel}>Volatilidad de Costo</span>
                                                <span className={styles.metricValue}>{fmt.format(analysisMetrics.volatility)}</span>
                                            </div>
                                            <div className={styles.metricCard}>
                                                <span className={styles.metricLabel}>Productos Asignados</span>
                                                <span className={styles.metricValue}>{products.length}</span>
                                            </div>
                                            <div className={styles.metricCard}>
                                                <span className={styles.metricLabel}>Aumentos 24h</span>
                                                <span className={styles.metricValue}>{analysisMetrics.recentChanges}</span>
                                            </div>
                                        </div>

                                        {products.length > 0 && (
                                            <div className={styles.histogramSection}>
                                                <h4 className={styles.sectionTitle}>Distribución de Márgenes por Producto</h4>
                                                <ResponsiveContainer width="100%" height={160}>
                                                    <BarChart
                                                        data={products.filter(p => p.margin !== null).map(p => ({ name: p.productName.slice(0, 12), margin: p.margin }))}
                                                        margin={isMobile
                                                            ? { top: 5, right: 8, left: 0, bottom: 0 }
                                                            : { top: 5, right: 8, left: 0, bottom: 0 }
                                                        }
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #374151)" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} width={isMobile ? 26 : 36} />
                                                        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                                                        <Bar dataKey="margin" fill="#769282" radius={[3, 3, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {analysisMetrics.topByMargin.length > 0 && (
                                            <div className={styles.top3Section}>
                                                <h4 className={styles.sectionTitle}>Top 3 por Margen Comercial</h4>
                                                {analysisMetrics.topByMargin.map((p, i) => (
                                                    <div key={p.productId} className={styles.top3Row}>
                                                        <span className={styles.top3Rank}>#{i + 1}</span>
                                                        <span className={styles.top3Name}>{p.productName}</span>
                                                        <span className={styles.top3Margin}>{p.margin?.toFixed(1)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {analysisMetrics.lowMarginAlerts.length > 0 && (
                                            <div className={styles.alertsSection}>
                                                <h4 className={styles.sectionTitle}><AlertTriangle size={14} /> Alertas de Margen Bajo (&lt;15%)</h4>
                                                {analysisMetrics.lowMarginAlerts.map(p => (
                                                    <div key={p.productId} className={styles.alertRow}>
                                                        <span>{p.productName}</span>
                                                        {getMarginBadge(p.margin)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ── MODALS ── */}
            {deleteId && (() => {
                const supplier = suppliers.find(s => s.id === deleteId);
                const isActive = supplier?.isActive ?? false;
                return (
                    <div className={styles.overlay} onClick={() => setDeleteId(null)} role="presentation" onKeyDown={(e) => e.key === 'Escape' && setDeleteId(null)}>
                        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                        <div className={styles.confirmModal} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="dialog" aria-labelledby="delete-confirmation-title">
                            <h4 id="delete-confirmation-title">{isActive ? '¿Desactivar proveedor?' : '¿Reactivar proveedor?'}</h4>
                            <p>{isActive ? 'Esta acción desactivará el proveedor. Podrás reactivarlo después si es necesario.' : 'Esta acción reactivará el proveedor y volverá a estar disponible.'}</p>
                            <div className={styles.confirmActions}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setDeleteId(null)}>Cancelar</button>
                                <button type="button" className={isActive ? styles.btnDanger : styles.btnSuccess} onClick={confirmDelete}>{isActive ? 'Desactivar' : 'Reactivar'}</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {updatingSupplier && (
                <PriceUpdateModal
                    productName={updatingSupplier.productName}
                    currentPrice={updatingSupplier.currentPrice}
                    currentCost={updatingSupplier.cost}
                    currentLeadTimeValue={updatingSupplier.leadTimeValue}
                    currentLeadTimeUnit={updatingSupplier.leadTimeUnit}
                    onClose={() => setUpdatingSupplier(null)}
                    onSave={handleSaveConditions}
                />
            )}

            {historyProduct && (
                <PriceHistoryModal
                    supplierId={selectedId!}
                    productId={historyProduct.productId}
                    productName={historyProduct.productName}
                    onClose={() => setHistoryProduct(null)}
                />
            )}
        </div>
    );
}