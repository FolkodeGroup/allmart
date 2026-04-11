import { useAdminOrders } from '../../context/AdminOrdersContext';
import { Badge } from './Badge/Badge';
import styles from './ShippingAlertsWidget.module.css';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { Button } from './Button/Button';

export default function ShippingAlertsWidget() {
  const { orders } = useAdminOrders();

  // Filtrar órdenes confirmadas pero no enviadas (necesitan ser procesadas para envío)
  const readyToShip = orders
    .filter(o => o.status === 'confirmado' || o.status === 'en-preparacion')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 5);

  const count = orders.filter(o => o.status === 'en-preparacion' || o.status === 'confirmado').length;

  if (readyToShip.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.icon}>🚚</span> Preparadas para Envío
          </h2>
          <span className={styles.badge}>0</span>
        </div>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>¡Perfecto! No hay órdenes pendientes de envío.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>📦</span> Preparadas para Envío
        </h2>
        <span className={`${styles.badge} ${styles.badgeAlert}`}>{count}</span>
      </div>

      <div className={styles.ordersList}>
        {readyToShip.map((order, idx) => (
          <div key={order.id} className={styles.orderItem}>
            <div className={styles.orderHeader}>
              <div className={styles.orderInfo}>
                <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
              </div>
              <Badge variant={order.status === 'en-preparacion' ? 'new' : 'new'}>
                {order.status === 'en-preparacion' ? 'En Preparación' : 'Confirmado'}
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
                <Button variant="primary" size="sm">Confirmar Envío</Button>
              </Link>
            </div>

            {idx < readyToShip.length - 1 && <div className={styles.divider} />}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Link to="/admin/pedidos?status=ready">
          <Button variant="secondary" size="sm">Ver todas las órdenes →</Button>
        </Link>
      </div>
    </section>
  );
}
