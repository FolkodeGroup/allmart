import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

// Umbral en px de arrastre hacia abajo para cerrar el modal (drag-to-dismiss)
const DISMISS_THRESHOLD = 100;

export function PriceHistoryModal({ supplierId, productId, productName, onClose, variant = 'default' }: PriceHistoryModalProps) {
    const [history, setHistory] = useState<ProductPriceHistoryDetailEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Drag-to-dismiss (mobile bottom sheet) ───────────────────────────────
    // Todo el movimiento se hace por ref + DOM directo, SIN pasar por setState,
    // para no re-renderizar (y no recalcular) el gráfico de Recharts en cada frame.
    const modalRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef<number | null>(null);
    const offsetRef = useRef(0);
    const [isDragActive, setIsDragActive] = useState(false); // solo para toggle de clase (sin transición)

    function handlePointerDown(e: React.PointerEvent) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        startYRef.current = e.clientY;
        setIsDragActive(true);
    }

    function handlePointerMove(e: React.PointerEvent) {
        if (startYRef.current === null || !modalRef.current) return;
        const delta = Math.max(0, e.clientY - startYRef.current); // solo hacia abajo
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

    const modalClassName = [
        styles.modal,
        variant === 'reports' ? styles.modalReports : '',
        isDragActive ? styles.dragging : '',
    ].filter(Boolean).join(' ');
    const headerTitleClassName = variant === 'reports' ? `${styles.headerTitle} ${styles.headerTitleReports}` : styles.headerTitle;
    const bodyClassName = variant === 'reports' ? `${styles.body} ${styles.bodyReports}` : styles.body;
    const chartSectionClassName = variant === 'reports' ? `${styles.chartSection} ${styles.chartSectionReports}` : styles.chartSection;
    const tableWrapperClassName = variant === 'reports' ? `${styles.tableWrapper} ${styles.tableWrapperReports}` : styles.tableWrapper;

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
                {/* Handle arrastrable — deslizar hacia abajo cierra el modal */}
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
                    <div id="price-history-title" className={headerTitleClassName}>
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
                    <div className={bodyClassName}>
                        {/* Sparkline */}
                        <div className={chartSectionClassName}>
                            <ResponsiveContainer width="100%" height={140}>
                                <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => fmt.format(v)} />
                                    <Tooltip formatter={(v: number) => fmt.format(v)} />
                                    <Line type="monotone" dataKey="price" stroke="#6366f1" dot={false} strokeWidth={2} name="Precio" />
                                    {chartData.some(d => d.cost !== null) && (
                                        <Line type="monotone" dataKey="cost" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="Costo" />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Table */}
                        <div className={tableWrapperClassName}>
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
        , document.body);
}