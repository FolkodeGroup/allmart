import React from 'react';
import styles from '../AdminReports.module.css';
import type { Order } from '../../../../context/AdminOrdersContext';

export interface OrdersTableProps {
    orders: Order[];
    page?: number;
    pageSize?: number;
    total?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= 600 : false
    );
    React.useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

// Utilidad para formatear fecha dd/mm/aa
function formatShortDate(dateStr: string) {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
    orders,
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
}) => {
    const isMobile = useIsMobile();

    // Mobile: selector de cantidad arriba, filtros 100%, paginación touch-friendly, cards con fecha dd/mm/aa
    if (isMobile) {
        return (
            <>
                {onPageSizeChange && pageSize && (
                    <div style={{ width: '100%', marginBottom: 12 }}>
                        <label className={styles.pageSizeLabel} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>Mostrando</span>
                            <select
                                className={styles.pageSizeSelect}
                                value={pageSize}
                                onChange={e => onPageSizeChange(Number(e.target.value))}
                                aria-label="Elementos por página"
                                style={{ flex: 1, minWidth: 0 }}
                            >
                                {[10, 20, 50, 100].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <span>por página</span>
                        </label>
                    </div>
                )}
                <div className={styles.orderCardsWrap}>
                    {orders.map(o => {
                        const statusLabel =
                            o.status === 'pendiente' ? 'Pendiente'
                                : o.status === 'confirmado' ? 'Confirmado'
                                    : o.status === 'en-preparacion' ? 'En preparación'
                                        : o.status === 'enviado' ? 'Enviado'
                                            : o.status === 'entregado' ? 'Entregado'
                                                : 'Cancelado';
                        const stClass = styles[`st_${o.status.replace('-', '_')}`] ?? '';
                        return (
                            <div key={o.id} className={styles.orderCard}>
                                <div className={styles.orderCardHeader}>
                                    <span className={styles.orderCardClient}>{o.customer.firstName} {o.customer.lastName}</span>
                                    <span className={styles.orderCardTotal}>
                                        {o.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                                    </span>
                                </div>
                                <div className={styles.orderCardBody}>
                                    <span className={styles.orderCardDate}>
                                        {formatShortDate(o.createdAt)}
                                    </span>
                                    <span className={styles.orderCardStatus + ' ' + stClass}>
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Paginación mobile centrada y touch-friendly */}
                {onPageChange && page && total && pageSize && (
                    <div style={{ margin: '18px 0 0 0', width: '100%' }}>
                        <nav className={styles.pagination} aria-label="Paginación" style={{ justifyContent: 'center', gap: 8 }}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => onPageChange(page - 1)}
                                disabled={page <= 1}
                                style={{ minWidth: 44, minHeight: 44, fontSize: 18 }}
                                aria-label="Anterior"
                            >‹</button>
                            <span className={styles.pageInfo} style={{ fontSize: 14, margin: '0 8px' }}>
                                Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
                            </span>
                            <button
                                className={styles.pageBtn}
                                onClick={() => onPageChange(page + 1)}
                                disabled={page >= Math.ceil(total / pageSize)}
                                style={{ minWidth: 44, minHeight: 44, fontSize: 18 }}
                                aria-label="Siguiente"
                            >›</button>
                        </nav>
                    </div>
                )}
            </>
        );
    }

    // Tabla desktop (sin cambios)
    return (
        <div className={styles.summaryTableWrap} aria-label="Tabla de pedidos" role="region">
            <table className={styles.summaryTable}>
                <thead>
                    <tr>
                        <th>N° Pedido</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th className={styles.tdRight}>Total</th>
                        <th>Estado</th>
                        <th>Pago</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(o => {
                        const statusLabel =
                            o.status === 'pendiente' ? 'Pendiente'
                                : o.status === 'confirmado' ? 'Confirmado'
                                    : o.status === 'en-preparacion' ? 'En preparación'
                                        : o.status === 'enviado' ? 'Enviado'
                                            : o.status === 'entregado' ? 'Entregado'
                                                : 'Cancelado';
                        const stClass = styles[`st_${o.status.replace('-', '_')}`] ?? '';
                        return (
                            <tr key={o.id}>
                                <td className={styles.tblId}>#{o.id.slice(0, 8).toUpperCase()}</td>
                                <td className={styles.tblDate}>
                                    {formatShortDate(o.createdAt)}
                                </td>
                                <td>{o.customer.firstName} {o.customer.lastName}</td>
                                <td className={`${styles.tblTotal} ${styles.tdRight}`}>
                                    {o.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                                </td>
                                <td>
                                    <span className={`${styles.stBadge} ${stClass}`}>{statusLabel}</span>
                                </td>
                                <td>
                                    <span className={`${styles.payBadge} ${o.paymentStatus === 'abonado' ? styles.payAbonado : styles.payPending}`}>
                                        {o.paymentStatus === 'abonado' ? '✓ Abonado' : '○ Sin abonar'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
