import { useAdminOrders } from '../../context/AdminOrdersContext';
import { Badge } from './Badge/Badge';
import styles from './PendingOrdersAlert.module.css';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { Button } from './Button/Button';

export default function PendingOrdersAlert() {
  const { orders } = useAdminOrders();

  // Filtrar órdenes pendientes de acción (estado pendiente o confirmado pero no enviadas)
  const pendingOrders = orders
    .filter(o => o.status === 'pendiente' || o.status === 'confirmado')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 5);

  const count = orders.filter(o => o.status === 'pendiente').length;

  if (pendingOrders.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.icon}>✅</span> Ordenes Pendientes
          </h2>
          <span className={styles.badge}>0</span>
        </div>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>¡Excelente! No hay órdenes pendientes de acción.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>⏳</span> Órdenes Pendientes de Acción
        </h2>
        <span className={`${styles.badge} ${styles.badgeAlert}`}>{count}</span>
      </div>

      <div className={styles.ordersList}>
        {pendingOrders.map((order, idx) => (
          <div key={order.id} className={styles.orderItem}>
            <div className={styles.orderHeader}>
              <div className={styles.orderInfo}>
                <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
              </div>
              <Badge variant={order.status === 'pendiente' ? 'discount' : 'new'}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>

            <div className={styles.customerInfo}>
              <strong>{order.customer.firstName} {order.customer.lastName}</strong>
              <span className={styles.email}>{order.customer.email}</span>
            </div>

            <div className={styles.orderMeta}>
              <span>{order.items.length} items</span>
              <span className={styles.total}>{formatCurrency(order.total)}</span>
            </div>

            <div className={styles.actions}>
              <Link to={`/admin/pedidos/${order.id}`}>
                <Button variant="primary" size="sm">Ver Detalles</Button>
              </Link>
            </div>

            {idx < pendingOrders.length - 1 && <div className={styles.divider} />}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Link to="/admin/pedidos">
          <Button variant="secondary" size="sm">Ver todos los pedidos →</Button>
        </Link>
      </div>
    </section>
  );
}
