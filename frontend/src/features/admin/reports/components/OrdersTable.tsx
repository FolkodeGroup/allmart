import React from 'react';
import styles from '../AdminReports.module.css';
import type { Order } from '../../../../context/AdminOrdersContext';
import { formatOrderCode } from '../../../../utils/orders';

export interface OrdersTableProps {
    orders: Order[];
    page?: number;
    pageSize?: number;
    total?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    printMode?: boolean;
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
    printMode = false,
}) => {
    const isMobile = useIsMobile();
    const badgeStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        lineHeight: 1.2,
        minHeight: 24,
        whiteSpace: 'nowrap',
        verticalAlign: 'top',
        boxSizing: 'border-box',
        textAlign: 'center',
        width: 'fit-content',
        maxWidth: '100%',
    };

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
        <div
            className={styles.summaryTableWrap}
            aria-label="Tabla de pedidos"
            role="region"
            style={printMode ? { overflow: 'visible', maxHeight: 'none', margin: 0, border: '1px solid #d0d7de' } : undefined}
        >
            <table
                className={styles.summaryTable}
                style={printMode ? { fontSize: 11, borderCollapse: 'collapse' } : undefined}
            >
                <thead>
                    <tr>
                        <th style={printMode ? { padding: '0.6rem 0.7rem', fontSize: 11, whiteSpace: 'nowrap' } : undefined}>N° Pedido</th>
                        <th style={printMode ? { padding: '0.6rem 0.7rem', fontSize: 11, whiteSpace: 'nowrap' } : undefined}>Fecha</th>
                        <th style={printMode ? { padding: '0.6rem 0.7rem', fontSize: 11, whiteSpace: 'nowrap' } : undefined}>Cliente</th>
                        <th className={styles.tdRight} style={printMode ? { padding: '0.6rem 0.7rem', fontSize: 11, textAlign: 'right', whiteSpace: 'nowrap' } : undefined}>Total</th>
                        <th style={printMode ? { padding: '0.6rem 0.7rem', fontSize: 11, textAlign: 'center', width: 140 } : undefined}>Estado</th>
                        <th style={printMode ? { padding: '0.6rem 0.7rem', fontSize: 11, textAlign: 'center', width: 140 } : undefined}>Pago</th>
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
                        const statusClassName = printMode ? undefined : `${styles.stBadge} ${stClass}`;
                        const paymentClassName = printMode ? undefined : `${styles.payBadge} ${o.paymentStatus === 'abonado' ? styles.payAbonado : styles.payPending}`;
                        const paymentText = o.paymentStatus === 'abonado' ? '✓ Abonado' : '○ Sin abonar';

                        return (
                            <tr key={o.id}>
                                <td className={styles.tblId} style={printMode ? { padding: '0.55rem 0.7rem', fontSize: 11 } : undefined}>#{formatOrderCode(o.id)}</td>
                                <td className={styles.tblDate} style={printMode ? { padding: '0.55rem 0.7rem', fontSize: 11, whiteSpace: 'nowrap' } : undefined}>
                                    {formatShortDate(o.createdAt)}
                                </td>
                                <td className={styles.tblCustomer} style={printMode ? { padding: '0.55rem 0.7rem', fontSize: 11 } : undefined}>
                                    {o.customer.firstName} {o.customer.lastName}
                                </td>
                                <td className={`${styles.tblTotal} ${styles.tdRight}`} style={printMode ? { padding: '0.55rem 0.7rem', fontSize: 11, textAlign: 'right', whiteSpace: 'nowrap' } : undefined}>
                                    {o.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                                </td>
                                <td style={printMode ? { padding: '0.55rem 0.7rem', textAlign: 'center', whiteSpace: 'nowrap' } : undefined}>
                                    <span
                                        className={statusClassName}
                                        style={printMode ? { ...badgeStyle, minWidth: 112, padding: '0', background: 'transparent', color: '#111827', fontWeight: 600, letterSpacing: '0.02em', } : undefined}
                                    >
                                        {statusLabel}
                                    </span>
                                </td>
                                <td style={printMode ? { padding: '0.55rem 0.7rem', textAlign: 'center', whiteSpace: 'nowrap' } : undefined}>
                                    <span
                                        className={paymentClassName}
                                        style={printMode ? { ...badgeStyle, minWidth: 116, padding: '0', background: 'transparent', color: '#111827', fontWeight: 600, letterSpacing: '0.02em', } : undefined}
                                    >
                                        {paymentText}
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
