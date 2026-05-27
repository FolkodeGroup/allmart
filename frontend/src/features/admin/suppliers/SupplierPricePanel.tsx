import React, { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    Globe, Phone, MapPin, TrendingUp, BarChart2,
    Table, Package, ExternalLink,
} from 'lucide-react';
import type { AdminSupplier, SupplierProductItem, ProductPriceHistoryEntry } from './suppliersAdminService';
import { suppliersAdminService } from './suppliersAdminService';
import styles from './SupplierPricePanel.module.css';

type ViewMode = 'chart' | 'table';

interface SupplierPricePanelProps {
    supplier: AdminSupplier;
    selectedProduct: SupplierProductItem | null;
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
});

function formatPrice(v: number) {
    return currencyFormatter.format(v);
}

export function SupplierPricePanel({ supplier, selectedProduct }: SupplierPricePanelProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('chart');
    const [history, setHistory] = useState<ProductPriceHistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = useCallback(async (productId: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await suppliersAdminService.getProductPriceHistory(productId);
            setHistory(data);
        } catch {
            setError('No se pudo cargar el historial de precios.');
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            loadHistory(selectedProduct.id);
        } else {
            setHistory([]);
            setError(null);
        }
    }, [selectedProduct, loadHistory]);

    return (
        <section className={styles.panel}>
            {/* ── Supplier info header ── */}
            <div className={styles.supplierHeader}>
                <div className={styles.supplierTitleRow}>
                    <span className={styles.supplierAvatar}>
                        {supplier.name.charAt(0).toUpperCase()}
                    </span>
                    <div className={styles.supplierTitleContent}>
                        <h3 className={styles.supplierName}>{supplier.name}</h3>
                        <div className={styles.supplierMeta}>
                            {supplier.url && (
                                <a
                                    href={supplier.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.metaLink}
                                >
                                    <Globe size={12} />
                                    {supplier.url.replace(/^https?:\/\//, '')}
                                    <ExternalLink size={10} />
                                </a>
                            )}
                            {supplier.phone && (
                                <span className={styles.metaItem}>
                                    <Phone size={12} />
                                    {supplier.phone}
                                </span>
                            )}
                            {supplier.address && (
                                <span className={styles.metaItem}>
                                    <MapPin size={12} />
                                    {supplier.address}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {supplier.products && (
                    <div className={styles.productsDesc}>
                        <Package size={13} className={styles.productsDescIcon} />
                        <span>{supplier.products}</span>
                    </div>
                )}
            </div>

            {/* ── Chart section ── */}
            <div className={styles.chartSection}>
                {!selectedProduct ? (
                    <div className={styles.emptyChart}>
                        <TrendingUp size={40} color="var(--color-text-tertiary)" />
                        <p className={styles.emptyChartText}>
                            Seleccioná un producto para ver su evolución de precios
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={styles.chartHeader}>
                            <div className={styles.chartTitle}>
                                <TrendingUp size={15} />
                                <span>Evolución de precios — <strong>{selectedProduct.name}</strong></span>
                            </div>
                            <div className={styles.viewToggle}>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${viewMode === 'chart' ? styles.toggleActive : ''}`}
                                    onClick={() => setViewMode('chart')}
                                    aria-label="Ver gráfico"
                                    title="Gráfico"
                                >
                                    <BarChart2 size={14} />
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.toggleActive : ''}`}
                                    onClick={() => setViewMode('table')}
                                    aria-label="Ver tabla"
                                    title="Tabla"
                                >
                                    <Table size={14} />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className={styles.chartLoading}>
                                <div className={styles.spinner} />
                                <span>Cargando historial...</span>
                            </div>
                        ) : error ? (
                            <div className={styles.chartError}>{error}</div>
                        ) : history.length === 0 ? (
                            <div className={styles.noHistory}>
                                <TrendingUp size={32} color="var(--color-text-tertiary)" />
                                <p>Este producto aún no tiene historial de ventas.</p>
                                <p className={styles.currentPrice}>
                                    Precio actual: <strong>{formatPrice(selectedProduct.price)}</strong>
                                </p>
                            </div>
                        ) : viewMode === 'chart' ? (
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart
                                        data={history}
                                        margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                                        />
                                        <YAxis
                                            tickFormatter={formatPrice}
                                            width={100}
                                            tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
                                        />
                                        <Tooltip
                                            formatter={(value: number, name: string) => [formatPrice(value), name]}
                                            contentStyle={{
                                                background: 'var(--color-bg-secondary)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="avgPrice"
                                            name="Precio promedio"
                                            stroke="var(--color-primary)"
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: 'var(--color-primary)' }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="minPrice"
                                            name="Precio mínimo"
                                            stroke="#22c55e"
                                            strokeWidth={1.5}
                                            strokeDasharray="5 3"
                                            dot={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="maxPrice"
                                            name="Precio máximo"
                                            stroke="#ef4444"
                                            strokeWidth={1.5}
                                            strokeDasharray="5 3"
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Mes</th>
                                            <th>Precio Prom.</th>
                                            <th>Precio Mín.</th>
                                            <th>Precio Máx.</th>
                                            <th>Ventas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(row => (
                                            <tr key={row.monthKey}>
                                                <td>{row.month}</td>
                                                <td className={styles.priceCell}>{formatPrice(row.avgPrice)}</td>
                                                <td className={styles.minCell}>{formatPrice(row.minPrice)}</td>
                                                <td className={styles.maxCell}>{formatPrice(row.maxPrice)}</td>
                                                <td>{row.salesCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
