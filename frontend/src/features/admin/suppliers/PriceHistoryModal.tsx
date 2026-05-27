import React, { useEffect, useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { suppliersAdminService, type ProductPriceHistoryDetailEntry } from './suppliersAdminService';
import styles from './PriceHistoryModal.module.css';

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

interface PriceHistoryModalProps {
    supplierId: string;
    productId: string;
    productName: string;
    onClose: () => void;
}

export function PriceHistoryModal({ supplierId, productId, productName, onClose }: PriceHistoryModalProps) {
    const [history, setHistory] = useState<ProductPriceHistoryDetailEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        suppliersAdminService.getProductPriceHistory(productId, { supplierId })
            .then(setHistory)
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, [productId, supplierId]);

    const chartData = history
        .slice()
        .reverse()
        .map(h => ({ date: h.createdAt.slice(0, 10), price: h.price, cost: h.cost }));

    const REASON_LABEL: Record<string, string> = {
        regular: 'Regular',
        promotion: 'Promoción',
        adjustment: 'Ajuste',
        negotiation: 'Negociación',
        market_adjustment: 'Ajuste de mercado',
    };

    return (
        <div className={styles.overlay} onClick={onClose} role="presentation" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div className={styles.modal} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="dialog" aria-labelledby="price-history-title">
                <div className={styles.header}>
                    <div id="price-history-title" className={styles.headerTitle}>
                        <TrendingUp size={16} />
                        <span>Historial de precios — <strong>{productName}</strong></span>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                </div>

                {loading ? (
                    <div className={styles.loading}>Cargando historial...</div>
                ) : history.length === 0 ? (
                    <div className={styles.empty}>Sin historial de precios disponible</div>
                ) : (
                    <div className={styles.body}>
                        {/* Sparkline */}
                        <div className={styles.chartSection}>
                            <ResponsiveContainer width="100%" height={140}>
                                <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt.format(v)} />
                                    <Tooltip formatter={(v: number) => fmt.format(v)} />
                                    <Line type="monotone" dataKey="price" stroke="#6366f1" dot={false} strokeWidth={2} name="Precio" />
                                    {chartData.some(d => d.cost !== null) && (
                                        <Line type="monotone" dataKey="cost" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Costo" />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Table */}
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Proveedor</th>
                                        <th>Precio</th>
                                        <th>Costo</th>
                                        <th>Margen %</th>
                                        <th>Razón</th>
                                        <th>Usuario</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(h => (
                                        <tr key={h.id}>
                                            <td>{new Date(h.createdAt).toLocaleDateString('es-AR')}</td>
                                            <td>{h.supplierName}</td>
                                            <td>{fmt.format(h.price)}</td>
                                            <td>{h.cost ? fmt.format(h.cost) : '—'}</td>
                                            <td>
                                                {h.margin !== null
                                                    ? <span className={h.margin < 10 ? styles.low : h.margin < 15 ? styles.mid : styles.ok}>{h.margin.toFixed(1)}%</span>
                                                    : '—'
                                                }
                                            </td>
                                            <td>{REASON_LABEL[h.changeReason] ?? h.changeReason}</td>
                                            <td>{h.changedBy ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
