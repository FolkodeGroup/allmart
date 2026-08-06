import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, Clock, DollarSign, Percent } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { suppliersAdminService, type ProductPriceHistoryDetailEntry } from './suppliersAdminService';
import styles from './PriceHistoryModal.module.css';

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

interface PriceHistoryModalProps {
    supplierId?: string;
    productId: string;
    productName: string;
    onClose: () => void;
    variant?: 'default' | 'reports';
}

const DISMISS_THRESHOLD = 100;

export function PriceHistoryModal({ supplierId, productId, productName, onClose, variant = 'default' }: PriceHistoryModalProps) {
    const [history, setHistory] = useState<ProductPriceHistoryDetailEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const modalRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef<number | null>(null);
    const offsetRef = useRef(0);
    const [isDragActive, setIsDragActive] = useState(false);

    function handlePointerDown(e: React.PointerEvent) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        startYRef.current = e.clientY;
        setIsDragActive(true);
    }

    function handlePointerMove(e: React.PointerEvent) {
        if (startYRef.current === null || !modalRef.current) return;
        const delta = Math.max(0, e.clientY - startYRef.current);
        offsetRef.current = delta;
        modalRef.current.style.transform = `translateY(${delta}px)`;
    }

    function handlePointerUp() {
        if (startYRef.current === null) return;
        const finalOffset = offsetRef.current;
        startYRef.current = null;
        offsetRef.current = 0;
        setIsDragActive(false);

        if (modalRef.current) {
            modalRef.current.style.transform = '';
        }
        if (finalOffset > DISMISS_THRESHOLD) {
            onClose();
        }
    }

    useEffect(() => {
        setLoading(true);
        suppliersAdminService.getProductPriceHistory(productId, supplierId ? { supplierId } : {})
            .then(setHistory)
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, [productId, supplierId]);

    const latest = history[0];
    const latestPrice = latest?.price ?? 0;
    const latestCost = latest?.cost ?? null;
    const latestLeadTime = latest?.leadTimeValue ? `${latest.leadTimeValue} ${latest.leadTimeUnit ?? 'días'}` : '3 días';
    const latestMargin = latestCost && latestPrice > 0 ? ((latestPrice - latestCost) / latestCost) * 100 : null;

    const chartData = history
        .slice()
        .reverse()
        .map(h => ({
            date: h.createdAt.slice(0, 10),
            Costo: h.cost ?? null,
            PrecioVenta: h.price,
        }));

    const REASON_LABEL: Record<string, string> = {
        regular: 'Regular',
        promotion: 'Promoción',
        adjustment: 'Ajuste',
        negotiation: 'Negociación',
        market_adjustment: 'Ajuste de mercado',
    };

    const modalClassName = [
        styles.modal,
        variant === 'reports' ? styles.modalReports : '',
        isDragActive ? styles.dragging : '',
    ].filter(Boolean).join(' ');

    return createPortal(
        <div className={styles.overlay} onClick={onClose} role="presentation" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
                ref={modalRef}
                className={modalClassName}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
                role="dialog"
                aria-labelledby="price-history-title"
            >
                <div
                    className={styles.dragHandle}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    role="button"
                    aria-label="Deslizar hacia abajo para cerrar"
                    tabIndex={-1}
                />

                <div className={styles.header}>
                    <div id="price-history-title" className={styles.headerTitle}>
                        <TrendingUp size={18} />
                        <span>Historial de Condiciones — <strong>{productName}</strong></span>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
                </div>

                {loading ? (
                    <div className={styles.loading}>Cargando historial de condiciones...</div>
                ) : history.length === 0 ? (
                    <div className={styles.empty}>Sin historial de condiciones disponible</div>
                ) : (
                    <div className={styles.body}>
                        {/* Tarjetas resumen de KPIs */}
                        <div className={styles.kpiBar}>
                            <div className={styles.kpiItem}>
                                <span className={styles.kpiLabel}><DollarSign size={12} /> Precio Venta Público</span>
                                <span className={styles.kpiValue}>{fmt.format(latestPrice)}</span>
                            </div>
                            <div className={styles.kpiItem}>
                                <span className={styles.kpiLabel}><DollarSign size={12} /> Costo Proveedor</span>
                                <span className={styles.kpiValue}>{latestCost ? fmt.format(latestCost) : '—'}</span>
                            </div>
                            <div className={styles.kpiItem}>
                                <span className={styles.kpiLabel}><Percent size={12} /> Margen %</span>
                                <span className={`${styles.kpiValue} ${latestMargin && latestMargin < 15 ? styles.warnMargin : styles.okMargin}`}>
                                    {latestMargin !== null ? `${latestMargin.toFixed(1)}%` : '—'}
                                </span>
                            </div>
                            <div className={styles.kpiItem}>
                                <span className={styles.kpiLabel}><Clock size={12} /> Tiempo de Entrega</span>
                                <span className={styles.kpiValue}>{latestLeadTime}</span>
                            </div>
                        </div>

                        {/* Gráfico comparativo de Líneas Limpias */}
                        <div className={styles.chartSection}>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #374151)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v: number) => fmt.format(v)} width={70} />
                                    <Tooltip
                                        formatter={(value: unknown, name: unknown) => [
                                            fmt.format(Number(value ?? 0)),
                                            String(name) === 'Costo' ? 'Costo Proveedor' : 'Precio Venta Público'
                                        ]}
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                                    <Line type="monotone" dataKey="Costo" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} name="Costo Proveedor" />
                                    <Line type="monotone" dataKey="PrecioVenta" stroke="#769282" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#769282' }} name="Precio Venta Público" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Tabla descriptiva con Lead Time */}
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Proveedor</th>
                                        <th>Costo</th>
                                        <th>Precio Venta</th>
                                        <th>Margen %</th>
                                        <th>Entrega</th>
                                        <th>Razón</th>
                                        <th>Usuario</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(h => {
                                        const marginVal = h.cost && h.price > 0 ? ((h.price - h.cost) / h.cost) * 100 : null;
                                        return (
                                            <tr key={h.id}>
                                                <td>{new Date(h.createdAt).toLocaleDateString('es-AR')}</td>
                                                <td>{h.supplierName}</td>
                                                <td style={{ fontWeight: 700, color: '#f59e0b' }}>{h.cost ? fmt.format(h.cost) : '—'}</td>
                                                <td>{fmt.format(h.price)}</td>
                                                <td>
                                                    {marginVal !== null ? (
                                                        <span className={marginVal < 10 ? styles.low : marginVal < 15 ? styles.mid : styles.ok}>
                                                            {marginVal.toFixed(1)}%
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td>{h.leadTimeValue ? `${h.leadTimeValue} ${h.leadTimeUnit ?? 'días'}` : '3 días'}</td>
                                                <td>{REASON_LABEL[h.changeReason] ?? h.changeReason}</td>
                                                <td>{h.changedBy ?? '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}