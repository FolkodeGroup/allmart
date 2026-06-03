import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Globe, Phone, Package, Mail, CheckCircle, XCircle, Edit2, PowerOff, TrendingUp, Table, BarChart2, AlertTriangle } from 'lucide-react';
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
import styles from './SuppliersMasterDetail.module.css';

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const fmtN = (v: number | null) => (v === null ? '—' : fmt.format(v));
const fmtPct = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`);

// ── Date helpers ────────────────────────────────────────────────────────────
function daysAgoISO(days: number) {
    const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10);
}

type TabId = 'chart' | 'table' | 'analysis';
type RangeId = 7 | 30 | 90;

interface SuppliersMasterDetailProps {
    suppliers: AdminSupplierV2[];
    loading: boolean;
    onNew: () => void;
    onEdit: (id: string) => void;
    onDeleted: () => void;
}

export function SuppliersMasterDetail({ suppliers, loading, onNew, onEdit, onDeleted }: SuppliersMasterDetailProps) {
    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState<'active' | 'inactive'>('active');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Right panel state
    const [activeTab, setActiveTab] = useState<TabId>('chart');
    const [products, setProducts] = useState<SupplierProductEntry[]>([]);
    const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
    const [rightLoading, setRightLoading] = useState(false);
    const [rangedays, setRangeDays] = useState<RangeId>(30);

    // Modals
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [historyProduct, setHistoryProduct] = useState<{ productId: string; productName: string } | null>(null);

    // Sort
    const [sortKey, setSortKey] = useState<keyof SupplierProductEntry>('productName');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // Auto-select first supplier
    useEffect(() => {
        if (!selectedId && suppliers.length > 0) {
            setSelectedId(suppliers[0].id);
        }
    }, [suppliers, selectedId]);

    // ── Load right panel data when supplier/tab changes ─────────────────────
    useEffect(() => {
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

    // ── Filtered supplier list ──────────────────────────────────────────────
    const filteredSuppliers = useMemo(() => {
        let list = suppliers;
        // Filter by status based on selected tab
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

    // ── Chart data: pivot history into { date, [productName]: price } ──────
    const chartData = useMemo(() => {
        if (history.length === 0) return [];
        const byDate: Record<string, Record<string, number>> = {};
        const productNames = new Set<string>();
        history.forEach(h => {
            const day = h.createdAt.slice(0, 10);
            if (!byDate[day]) byDate[day] = {};
            byDate[day][h.productName] = h.price;
            productNames.add(h.productName);
        });
        const sorted = Object.keys(byDate).sort();
        return sorted.map(day => ({ date: day, ...byDate[day] }));
    }, [history]);

    const chartProducts = useMemo(() => {
        const names = new Set<string>();
        history.forEach(h => names.add(h.productName));
        return Array.from(names).slice(0, 8); // max 8 lines
    }, [history]);

    const LINE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6'];

    // ── Sort products table ─────────────────────────────────────────────────
    const sortedProducts = useMemo(() => {
        return [...products].sort((a, b) => {
            const va = a[sortKey] ?? 0;
            const vb = b[sortKey] ?? 0;
            if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(String(vb)) : String(vb).localeCompare(va);
            return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
        });
    }, [products, sortKey, sortDir]);

    function toggleSort(key: keyof SupplierProductEntry) {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
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
        const header = ['SKU', 'Producto', 'Precio', 'Costo', 'Margen %', 'Cambio 7d %', 'Última actualización'];
        const rows = products.map(p => [
            p.sku ?? '', p.productName, p.currentPrice, p.cost ?? '', p.margin ?? '',
            p.priceChangePercent ?? '', p.lastPriceChange ? new Date(p.lastPriceChange).toLocaleDateString('es-AR') : '',
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'productos-proveedor.csv'; a.click();
        URL.revokeObjectURL(url);
    }

    // ── Delete ──────────────────────────────────────────────────────────────
    async function confirmDelete() {
        if (!deleteId) return;
        try {
            await suppliersAdminService.deleteSupplierV2(deleteId);
            if (selectedId === deleteId) setSelectedId(null);
            onDeleted();
        } finally {
            setDeleteId(null);
        }
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
                {/* Search & filter */}
                <div className={styles.leftHeader}>
                    <div className={styles.searchRow}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Buscar proveedor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
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

                {/* Supplier list */}
                <div className={styles.supplierList}>
                    {loading ? (
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
                                            <Edit2 size={13} />
                                        </button>
                                        <button className={styles.iconBtn} onClick={e => { e.stopPropagation(); setDeleteId(s.id); }} title="Desactivar proveedor">
                                            <PowerOff size={13} />
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
                        {/* Supplier header */}
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
                            {(['chart', 'table', 'analysis'] as TabId[]).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab(t)}
                                >
                                    {t === 'chart' && <><TrendingUp size={13} /> Fluctuación</>}
                                    {t === 'table' && <><Table size={13} /> Productos</>}
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
                                {/* ── TAB: CHART ── */}
                                {activeTab === 'chart' && (
                                    <div className={styles.chartTab}>
                                        <div className={styles.chartControls}>
                                            <span className={styles.controlLabel}>Rango:</span>
                                            {([7, 30, 90] as RangeId[]).map(d => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    className={`${styles.rangeBtn} ${rangedays === d ? styles.rangeBtnActive : ''}`}
                                                    onClick={() => setRangeDays(d)}
                                                >
                                                    {d}d
                                                </button>
                                            ))}
                                        </div>
                                        {chartData.length === 0 ? (
                                            <div className={styles.emptyChart}>
                                                <TrendingUp size={36} />
                                                <p>Sin historial de precios para el período seleccionado</p>
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={320}>
                                                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmt.format(v)} />
                                                    <Tooltip formatter={(v: number) => fmt.format(v)} />
                                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                                    {chartProducts.map((name, i) => (
                                                        <Line key={name} type="monotone" dataKey={name}
                                                            stroke={LINE_COLORS[i % LINE_COLORS.length]}
                                                            dot={false} strokeWidth={2} />
                                                    ))}
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                )}

                                {/* ── TAB: TABLE ── */}
                                {activeTab === 'table' && (
                                    <div className={styles.tableTab}>
                                        <div className={styles.tableActions}>
                                            <span className={styles.tableCount}>{products.length} producto{products.length !== 1 ? 's' : ''}</span>
                                            <button type="button" className={styles.exportBtn} onClick={exportCsv}>
                                                Exportar CSV
                                            </button>
                                        </div>
                                        {products.length === 0 ? (
                                            <div className={styles.emptyTable}>Sin productos asignados a este proveedor</div>
                                        ) : (
                                            <div className={styles.tableWrapper}>
                                                <table className={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            {([
                                                                ['sku', 'SKU'],
                                                                ['productName', 'Nombre'],
                                                                ['currentPrice', 'Precio'],
                                                                ['cost', 'Costo'],
                                                                ['margin', 'Margen %'],
                                                                ['priceChangePercent', 'Cambio 7d'],
                                                                ['lastPriceChange', 'Última actualización'],
                                                            ] as [keyof SupplierProductEntry, string][]).map(([key, label]) => (
                                                                <th key={key} onClick={() => toggleSort(key)} className={styles.thSortable}>
                                                                    {label} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sortedProducts.map(p => (
                                                            <tr
                                                                key={p.productId}
                                                                className={styles.tableRow}
                                                                onClick={() => setHistoryProduct({ productId: p.productId, productName: p.productName })}
                                                            >
                                                                <td className={styles.tdSku}>{p.sku ?? '—'}</td>
                                                                <td>{p.productName}</td>
                                                                <td>{fmtN(p.currentPrice)}</td>
                                                                <td>{fmtN(p.cost)}</td>
                                                                <td>{getMarginBadge(p.margin)}</td>
                                                                <td className={p.priceChangePercent && p.priceChangePercent > 15 ? styles.tdWarn : ''}>
                                                                    {fmtPct(p.priceChangePercent)}
                                                                </td>
                                                                <td className={styles.tdDate}>
                                                                    {p.lastPriceChange ? new Date(p.lastPriceChange).toLocaleDateString('es-AR') : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── TAB: ANALYSIS ── */}
                                {activeTab === 'analysis' && (
                                    <div className={styles.analysisTab}>
                                        {/* Metric cards */}
                                        <div className={styles.metricCards}>
                                            <div className={styles.metricCard}>
                                                <span className={styles.metricLabel}>Margen Promedio</span>
                                                <span className={styles.metricValue}>
                                                    {analysisMetrics.avgMargin !== null ? `${analysisMetrics.avgMargin.toFixed(1)}%` : '—'}
                                                </span>
                                            </div>
                                            <div className={styles.metricCard}>
                                                <span className={styles.metricLabel}>Volatilidad</span>
                                                <span className={styles.metricValue}>{fmt.format(analysisMetrics.volatility)}</span>
                                            </div>
                                            <div className={styles.metricCard}>
                                                <span className={styles.metricLabel}>Productos</span>
                                                <span className={styles.metricValue}>{products.length}</span>
                                            </div>
                                            <div className={styles.metricCard}>
                                                <span className={styles.metricLabel}>Cambios 24h</span>
                                                <span className={styles.metricValue}>{analysisMetrics.recentChanges}</span>
                                            </div>
                                        </div>

                                        {/* Margin histogram */}
                                        {products.length > 0 && (
                                            <div className={styles.histogramSection}>
                                                <h4 className={styles.sectionTitle}>Distribución de Márgenes</h4>
                                                <ResponsiveContainer width="100%" height={160}>
                                                    <BarChart data={products.filter(p => p.margin !== null).map(p => ({ name: p.productName.slice(0, 12), margin: p.margin }))}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                                        <YAxis tick={{ fontSize: 10 }} />
                                                        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                                                        <Bar dataKey="margin" fill="#6366f1" radius={[3, 3, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Top 3 by margin */}
                                        {analysisMetrics.topByMargin.length > 0 && (
                                            <div className={styles.top3Section}>
                                                <h4 className={styles.sectionTitle}>Top 3 por Margen</h4>
                                                {analysisMetrics.topByMargin.map((p, i) => (
                                                    <div key={p.productId} className={styles.top3Row}>
                                                        <span className={styles.top3Rank}>#{i + 1}</span>
                                                        <span className={styles.top3Name}>{p.productName}</span>
                                                        <span className={styles.top3Margin}>{p.margin?.toFixed(1)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Alerts */}
                                        {analysisMetrics.lowMarginAlerts.length > 0 && (
                                            <div className={styles.alertsSection}>
                                                <h4 className={styles.sectionTitle}><AlertTriangle size={14} /> Alertas de Margen</h4>
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
            {deleteId && (
                <div className={styles.overlay} onClick={() => setDeleteId(null)} role="presentation" onKeyDown={(e) => e.key === 'Escape' && setDeleteId(null)}>
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                    <div className={styles.confirmModal} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="dialog" aria-labelledby="delete-confirmation-title">
                        <h4 id="delete-confirmation-title">¿Desactivar proveedor?</h4>
                        <p>Esta acción desactivará el proveedor. Podrás reactivarlo después si es necesario.</p>
                        <div className={styles.confirmActions}>
                            <button type="button" className={styles.btnSecondary} onClick={() => setDeleteId(null)}>Cancelar</button>
                            <button type="button" className={styles.btnDanger} onClick={confirmDelete}>Desactivar</button>
                        </div>
                    </div>
                </div>
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
