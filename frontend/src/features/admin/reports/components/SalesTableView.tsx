import { useMemo, useState, useEffect } from 'react';
import type { Order } from '../../../../context/AdminOrdersContext';
import styles from '../AdminReports.module.css';

type Props = {
    orders: Order[];
    formatPrice: (n: number) => string;
    dayKeys: string[];
};

type Product = {
    name: string;
    qty: number;
};

type DayData = {
    dateKey: string;
    total: number;
    products: Product[];
};

export function SalesTableView({ orders, formatPrice, dayKeys }: Props) {
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

    const data = useMemo(() => {
        const map = new Map<string, DayData>();

        // 1. Agrupar datos reales
        orders.forEach(order => {
            if (order.status === 'cancelado') return;

            const dateKey = order.createdAt.slice(0, 10);

            if (!map.has(dateKey)) {
                map.set(dateKey, {
                    dateKey,
                    total: 0,
                    products: [],
                });
            }

            const day = map.get(dateKey)!;
            day.total += order.total;

            order.items.forEach(item => {
                const existing = day.products.find(p => p.name === item.productName);

                if (existing) {
                    existing.qty += item.quantity;
                } else {
                    day.products.push({
                        name: item.productName,
                        qty: item.quantity,
                    });
                }
            });
        });

        // ✅ CASO 1: TODO EL TIEMPO (sin dayKeys)
        if (!dayKeys || dayKeys.length === 0) {
            return Array.from(map.values()).sort((a, b) =>
                a.dateKey.localeCompare(b.dateKey)
            );
        }

        // ✅ CASO 2: rango (7d, 30d, 90d, custom)
        return dayKeys.map(dateKey => {
            if (map.has(dateKey)) {
                return map.get(dateKey)!;
            }

            return {
                dateKey,
                total: 0,
                products: [],
            };
        });

    }, [orders, dayKeys]);


    const formatDate = (dateKey: string) => {
        const d = new Date(dateKey);
        return d.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedDay(null);
            }
        };

        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);



    return (
        <>
            <div className={styles.tableResponsive}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Día</th>
                            <th>Ganancias</th>
                            <th>Productos vendidos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(day => {
                            const hasMore = day.products.length > 10;
                            const visibleProducts = day.products.slice(0, 10);

                            return (
                                <tr key={day.dateKey}>
                                    <td><div className={styles.tableCell}>{formatDate(day.dateKey)}</div></td>

                                    <td><div className={styles.tableCell}>{formatPrice(day.total)}</div></td>

                                    <td>
                                        <div className={styles.tableCell}>
                                            {day.products.length === 0 ? (
                                                <span className={styles.noDataProducts}>Sin ventas</span>
                                            ) : (
                                                visibleProducts.map((p, i) => (
                                                    <span key={i}>
                                                        {p.name} (x{p.qty})
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                        {hasMore && (
                                            <>
                                                {' '}
                                                <button
                                                    className={styles.viewMoreBtn}
                                                    onClick={() => setSelectedDay(day)}
                                                >
                                                    Ver más ({day.products.length})
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {selectedDay && (
                <div className={styles.modalOverlay}>
                    <div
                        className={styles.modalContent}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={styles.modalHeader}>
                            <h3>
                                📅 {formatDate(selectedDay.dateKey)} — {formatPrice(selectedDay.total)}
                            </h3>

                            <button
                                className={styles.modalClose}
                                onClick={() => setSelectedDay(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {selectedDay.products.map((p, i) => (
                                <div key={i} className={styles.modalRow}>
                                    <span>{p.name}</span>
                                    <strong>x{p.qty}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}