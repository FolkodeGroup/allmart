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

/* 🎨 Estilos de alto contraste para el PDF de impresión */
function getPrintStatusBadgeStyle(status: string): React.CSSProperties {
    const map: Record<string, { bg: string; color: string; border: string }> = {
        pendiente:      { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
        confirmado:     { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
        'en-preparacion': { bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' },
        preparado:      { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
        enviado:        { bg: '#CFFAFE', color: '#155E75', border: '#A5F3FC' },
        entregado:      { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
        cancelado:      { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
    };

    const style = map[status] ?? { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };

    return {
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '9px',
        fontWeight: 700,
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        textAlign: 'center',
        whiteSpace: 'nowrap',
    };
}

function getPrintPaymentBadgeStyle(paymentStatus?: string): React.CSSProperties {
    const isPaid = paymentStatus === 'abonado';
    return {
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '9px',
        fontWeight: 700,
        backgroundColor: isPaid ? '#D1FAE5' : '#F3F4F6',
        color: isPaid ? '#065F46' : '#4B5563',
        border: `1px solid ${isPaid ? '#A7F3D0' : '#E5E7EB'}`,
        textAlign: 'center',
        whiteSpace: 'nowrap',
    };
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

    // Mobile: selector de cantidad arriba, filtros 100%, paginación touch-friendly, cards con fecha dd/mm/aa
    if (isMobile && !printMode) {
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
                        const paymentLabel = o.paymentStatus === 'abonado' ? 'Abonado' : 'Sin abonar';

                        return (
                            <div key={o.id} className={styles.orderCard}>
                                <div className={styles.orderCardHeader}>
                                    <div className={styles.orderCardHeaderLeft}>
                                        <span className={styles.orderCardClient}>{o.customer.firstName} {o.customer.lastName}</span>
                                        <span className={styles.orderCardId}>Pedido #{formatOrderCode(o.id)}</span>
                                    </div>
                                    <span className={styles.orderCardTotal}>
                                        {o.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                                    </span>
                                </div>
                                <div className={styles.orderCardBody}>
                                    <div className={styles.orderCardMeta}>
                                        <span className={styles.orderCardDate}>
                                            {formatShortDate(o.createdAt)}
                                        </span>
                                        <span className={styles.orderCardPayment}>{paymentLabel}</span>
                                    </div>
                                    <span className={styles.orderCardStatus + ' ' + stClass}>
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
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

    // MODO IMPRESIÓN PDF (Alto contraste claro)
    if (printMode) {
        return (
            <div style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E5E2DD', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', background: '#FFFFFF' }}>
                    <thead>
                        <tr style={{ background: '#769282', color: '#FFFFFF' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: '10px' }}>N° Pedido</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: '10px' }}>Fecha</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: '10px' }}>Cliente</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: '10px' }}>Total</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, fontSize: '10px', width: '110px' }}>Estado</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, fontSize: '10px', width: '100px' }}>Pago</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o, index) => {
                            const statusLabel =
                                o.status === 'pendiente' ? 'Pendiente'
                                    : o.status === 'confirmado' ? 'Confirmado'
                                        : o.status === 'en-preparacion' ? 'En preparación'
                                            : o.status === 'enviado' ? 'Enviado'
                                                : o.status === 'entregado' ? 'Entregado'
                                                    : 'Cancelado';
                            const paymentText = o.paymentStatus === 'abonado' ? '✓ Abonado' : '○ Sin abonar';
                            const bg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

                            return (
                                <tr key={o.id} style={{ background: bg, borderBottom: '1px solid #E5E2DD' }}>
                                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#5D7568', fontFamily: 'monospace' }}>
                                        #{formatOrderCode(o.id)}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#475569', whiteSpace: 'nowrap' }}>
                                        {formatShortDate(o.createdAt)}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#111827', fontWeight: 600 }}>
                                        {o.customer.firstName} {o.customer.lastName}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                                        {o.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        <span style={getPrintStatusBadgeStyle(o.status)}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        <span style={getPrintPaymentBadgeStyle(o.paymentStatus)}>
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
    }

    // Tabla desktop normal
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
                        const statusClassName = `${styles.stBadge} ${stClass}`;
                        const paymentClassName = `${styles.payBadge} ${o.paymentStatus === 'abonado' ? styles.payAbonado : styles.payPending}`;
                        const paymentText = o.paymentStatus === 'abonado' ? '✓ Abonado' : '○ Sin abonar';

                        return (
                            <tr key={o.id}>
                                <td className={styles.tblId}>#{formatOrderCode(o.id)}</td>
                                <td className={styles.tblDate}>{formatShortDate(o.createdAt)}</td>
                                <td className={styles.tblCustomer}>{o.customer.firstName} {o.customer.lastName}</td>
                                <td className={`${styles.tblTotal} ${styles.tdRight}`}>
                                    {o.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                                </td>
                                <td>
                                    <span className={statusClassName}>
                                        {statusLabel}
                                    </span>
                                </td>
                                <td>
                                    <span className={paymentClassName}>
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