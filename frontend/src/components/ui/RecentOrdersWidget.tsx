import { useAdminOrders } from '../../context/AdminOrdersContext';
import { Container } from './Container/Container';
import { Badge } from './Badge/Badge';
import styles from './RecentOrdersWidget.module.css';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { formatOrderCode } from '../../utils/orders';

const STATUS_COLORS = {
  pendiente: 'discount' as const,
  confirmado: 'new' as const,
  'en-preparacion': 'new' as const,
  enviado: 'new' as const,
  entregado: 'new' as const,
  cancelado: 'outOfStock' as const,
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
    <div className={styles.card}>
      <h3 className={styles.title}>Pedidos Recientes</h3>

      {/* Vista de Tabla Escritorio (>= 768px) */}
      <div className={styles.tableWrapperDesktop}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>N° PEDIDO</th>
              <th>FECHA</th>
              <th>CLIENTE</th>
              <th>PRODUCTOS</th>
              <th>TOTAL</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id}>
                <td className={styles.idTd}>#{formatOrderCode(order.id)}</td>
                <td className={styles.dateTd}>{formatDate(order.createdAt)}</td>
                <td>
                  <strong className={styles.nameTd}>{order.customer.firstName} {order.customer.lastName}</strong><br />
                  <span className={styles.email}>{order.customer.email}</span>
                </td>
                <td className={styles.quantityTd}>{order.items.reduce((acc, item) => acc + item.quantity, 0)} ítems</td>
                <td className={styles.priceTd}>{formatCurrency(order.total)}</td>
                <td>
                  <Badge variant={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] ?? 'new'}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </td>
                <td>
                  <Link to={`/admin/pedidos/${order.id}`} className={styles.desktopActionBtn}>
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de Tarjetas Móviles (< 768px) */}
      <div className={styles.mobileCardsList}>
        {recentOrders.map(order => (
          <div key={order.id} className={styles.mobileCard}>
            <div className={styles.mobileCardHeader}>
              <span className={styles.mobileCode}>#{formatOrderCode(order.id)}</span>
              <Badge variant={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] ?? 'new'}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileClientInfo}>
                <strong className={styles.mobileName}>{order.customer.firstName} {order.customer.lastName}</strong>
                <span className={styles.mobileEmail}>{order.customer.email}</span>
              </div>
              <div className={styles.mobileMetaRow}>
                <span className={styles.mobileDate}>{formatDate(order.createdAt)}</span>
                <span className={styles.mobileDot}>•</span>
                <span className={styles.mobileItems}>{order.items.reduce((acc, item) => acc + item.quantity, 0)} ítems</span>
                <span className={styles.mobileTotal}>{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div className={styles.mobileCardFooter}>
              <Link to={`/admin/pedidos/${order.id}`} className={styles.mobileActionBtn}>
                Ver detalle →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}