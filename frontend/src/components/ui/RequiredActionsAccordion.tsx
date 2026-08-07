import { useState, useMemo } from 'react';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { TabsWrapper, type TabDefinition } from './TabsWrapper';
import { Badge } from './Badge/Badge';
import { Button } from './Button/Button';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './RequiredActionsAccordion.module.css';
import type { Order } from '../../context/AdminOrdersContext';

export default function RequiredActionsAccordion() {
  const { orders } = useAdminOrders();
  const [isExpanded, setIsExpanded] = useState(true);

  // ─── Filter data for each tab ───────────────────────────────────────────────

  const pendingOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'pendiente' || o.status === 'confirmado')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const readyToShip = useMemo(() => {
    return orders
      .filter(o => o.status === 'confirmado' || o.status === 'en-preparacion')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const unpaidOrders = useMemo(() => {
    return orders
      .filter(o => !o.paymentStatus || o.paymentStatus === 'no-abonado')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const totalUnpaid = useMemo(() => {
    return unpaidOrders.reduce((acc, o) => acc + o.total, 0);
  }, [unpaidOrders]);

  const tabs: TabDefinition[] = [
    { id: 'pending', label: 'Órdenes Pendientes' },
    { id: 'shipping', label: 'Preparadas para Envío' },
    { id: 'payment', label: 'Pagos Pendientes' },
  ];

  const statusBadgeVariantMap: Record<string, 'discount' | 'new' | 'outOfStock'> = {
    'pendiente': 'discount',
    'confirmado': 'new',
    'en-preparacion': 'new',
    'enviado': 'new',
    'entregado': 'new',
    'cancelado': 'outOfStock',
  };

  const statusLabelMap: Record<string, string> = {
    'pendiente': 'Pendiente',
    'confirmado': 'Confirmado',
    'en-preparacion': 'En Preparación',
    'enviado': 'Enviado',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado',
  };

  const renderTableRow = (order: Order) => {
    const statusBadgeVariant = statusBadgeVariantMap[order.status] || 'new';
    const statusLabel = statusLabelMap[order.status] || order.status;
    const customerName = `${order.customer.firstName} ${order.customer.lastName}`;

    return (
      <tr key={order.id} className={styles.tableRow}>
        <td className={styles.tableCellClient}>{customerName}</td>
        <td className={styles.tableCellDate}>{formatDate(order.createdAt)}</td>
        <td className={styles.tableCell}>
          <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
        </td>
        <td className={styles.tableCellAmount}>{formatCurrency(order.total)}</td>
        <td className={styles.tableCellAction}>
          <Link to={`/admin/pedidos/${order.id}`}>
            <Button variant="secondary" size="sm">Ver Detalles</Button>
          </Link>
        </td>
      </tr>
    );
  };

  const renderMobileCard = (order: Order) => {
    const statusBadgeVariant = statusBadgeVariantMap[order.status] || 'new';
    const statusLabel = statusLabelMap[order.status] || order.status;
    const customerName = `${order.customer.firstName} ${order.customer.lastName}`;

    return (
      <div key={order.id} className={styles.mobileCard}>
        <div className={styles.mobileCardHeader}>
          <span className={styles.mobileClientName}>{customerName}</span>
          <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
        </div>
        <div className={styles.mobileCardBody}>
          <div className={styles.mobileMetaRow}>
            <span className={styles.mobileDate}>{formatDate(order.createdAt)}</span>
            <span className={styles.mobileAmount}>{formatCurrency(order.total)}</span>
          </div>
        </div>
        <div className={styles.mobileCardFooter}>
          <Link to={`/admin/pedidos/${order.id}`} className={styles.mobileDetailBtn}>
            Ver Detalles →
          </Link>
        </div>
      </div>
    );
  };

  const renderOrdersList = (ordersList: Order[], emptyMsg: string) => {
    if (ordersList.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className={styles.tabContent}>
        {/* Vista de Tabla Escritorio (>= 768px) */}
        <div className={styles.tableWrapperDesktop}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={styles.tableHeaderCell}>Cliente</th>
                <th className={styles.tableHeaderCell}>Fecha</th>
                <th className={styles.tableHeaderCell}>Estado</th>
                <th className={styles.tableHeaderCell}>Monto</th>
                <th className={styles.tableHeaderCell}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordersList.map((order) => renderTableRow(order))}
            </tbody>
          </table>
        </div>

        {/* Vista de Tarjetas Móviles (< 768px) */}
        <div className={styles.mobileCardsList}>
          {ordersList.map((order) => renderMobileCard(order))}
        </div>
      </div>
    );
  };

  const pendingCount = pendingOrders.length;
  const shippingCount = readyToShip.length;
  const paymentCount = unpaidOrders.length;
  const totalCount = pendingCount + shippingCount + paymentCount;

  return (
    <section className={styles.accordion}>
      <button
        className={styles.accordionHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        type="button"
      >
        <div className={styles.accordionHeaderLeft}>
          <span className={styles.accordionIcon}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <h2 className={styles.accordionTitle}>
            Acciones Requeridas
          </h2>
        </div>
        <div className={styles.accordionBadges}>
          {totalCount > 0 && (
            <span className={`${styles.badge} ${styles.badgeAlert}`}>
              {totalCount} acciones
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className={styles.accordionContent}>
          <TabsWrapper tabs={tabs} defaultTab="pending">
            {renderOrdersList(pendingOrders, '✅ No hay órdenes pendientes de acción.')}
            {renderOrdersList(readyToShip, '✅ No hay órdenes pendientes de envío.')}
            <div>
              {unpaidOrders.length > 0 && (
                <div className={styles.totalBar}>
                  <span>Total pendiente:</span>
                  <strong>{formatCurrency(totalUnpaid)}</strong>
                </div>
              )}
              {renderOrdersList(unpaidOrders, '✅ Todos los pagos están al día.')}
            </div>
          </TabsWrapper>
        </div>
      )}
    </section>
  );
}