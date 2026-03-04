// import React from 'react';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { Container } from './Container/Container';
import { Button } from './Button/Button';
import { Badge } from './Badge/Badge';
import styles from './RecentOrdersWidget.module.css';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  pendiente: 'new' as const,
  confirmado: 'new' as const,
  'en-preparacion': 'new' as const,
  enviado: 'new' as const,
  entregado: 'new' as const,
  cancelado: 'discount' as const,
};

export default function RecentOrdersWidget() {
  const { orders } = useAdminOrders();
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recentOrders = sortedOrders.slice(0, 5);

  if (recentOrders.length === 0) {
    return (
      <Container className={styles.card}>
        <div className={styles.emptyState}>
          <span role="img" aria-label="Sin pedidos">🛒</span>
          <p>No hay pedidos recientes.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.card}>
      <h3 className={styles.title}>Pedidos Recientes</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>N° Pedido</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>
                <strong>{order.customer.firstName} {order.customer.lastName}</strong><br />
                <span className={styles.email}>{order.customer.email}</span>
              </td>
              <td>{order.items.reduce((acc, item) => acc + item.quantity, 0)} ítems</td>
              <td>{formatCurrency(order.total)}</td>
              <td>
                <Badge variant={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] ?? 'new'}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </td>
              <td>
                <Link to={`/admin/pedidos/${order.id}`}>
                  <Button variant="secondary" size="sm">Ver →</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
}
