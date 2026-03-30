import React from 'react';
import styles from '../AdminReports.module.css';
import type { Order } from '../../../../context/AdminOrdersContext';

export interface OrdersTableProps {
    orders: Order[];
}

/**
 * Tabla de pedidos filtrados y paginados.
 *
 * @param orders Array de pedidos a mostrar
 */
export const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {

    return (
        <div className={styles.summaryTableWrap}>
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
                                    {new Date(o.createdAt).toLocaleDateString('es-AR', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                    })}
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
