import { useAdminOrders } from '../../context/AdminOrdersContext';
import { Badge } from './Badge/Badge';
import styles from './PaymentAlertsWidget.module.css';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { Button } from './Button/Button';

export default function PaymentAlertsWidget() {
  const { orders } = useAdminOrders();

  // Filtrar órdenes no pagadas
  const unpaidOrders = orders
    .filter(o => !o.paymentStatus || o.paymentStatus === 'no-abonado')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 5);

  const count = unpaidOrders.length;
  const totalPending = unpaidOrders.reduce((acc, o) => acc + o.total, 0);

  if (unpaidOrders.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.icon}>💳</span> Pagos Pendientes
          </h2>
          <span className={styles.badge}>0</span>
        </div>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>¡Perfecto! Todos los pagos están al día.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>💰</span> Pagos Pendientes
        </h2>
        <span className={`${styles.badge} ${styles.badgeAlert}`}>{count}</span>
      </div>

      <div className={styles.totalBar}>
        <span>Total pendiente:</span>
        <strong>{formatCurrency(totalPending)}</strong>
      </div>

      <div className={styles.ordersList}>
        {unpaidOrders.map((order, idx) => (
          <div key={order.id} className={styles.orderItem}>
            <div className={styles.orderHeader}>
              <div className={styles.orderInfo}>
                <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
              </div>
              <Badge variant="discount">No Pagado</Badge>
            </div>

            <div className={styles.customerInfo}>
              <strong>{order.customer.firstName} {order.customer.lastName}</strong>
              <span className={styles.email}>{order.customer.email}</span>
            </div>

            <div className={styles.orderAmount}>
              <span>{order.items.length} items</span>
              <span className={styles.amount}>{formatCurrency(order.total)}</span>
            </div>

            <div className={styles.actions}>
              <Link to={`/admin/pedidos/${order.id}`}>
                <Button variant="primary" size="sm">Cobrar ahora</Button>
              </Link>
            </div>

            {idx < unpaidOrders.length - 1 && <div className={styles.divider} />}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Link to="/admin/pedidos?payment=unpaid">
          <Button variant="secondary" size="sm">Ver todos los pagos pendientes →</Button>
        </Link>
      </div>
    </section>
  );
}
