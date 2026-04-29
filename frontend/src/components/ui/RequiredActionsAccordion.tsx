import { useState, useMemo } from 'react';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { TabsWrapper, type TabDefinition } from './TabsWrapper';
import { Badge } from './Badge/Badge';
import { Button } from './Button/Button';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './RequiredActionsAccordion.module.css';

export default function RequiredActionsAccordion() {
  const { orders } = useAdminOrders();
  const [isExpanded, setIsExpanded] = useState(true);

  // ─── Filter data for each tab ───────────────────────────────────────────────

  // Tab 1: Órdenes Pendientes de Acción
  const pendingOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'pendiente' || o.status === 'confirmado')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  // Tab 2: Preparadas para Envío
  const readyToShip = useMemo(() => {
    return orders
      .filter(o => o.status === 'confirmado' || o.status === 'en-preparacion')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  // Tab 3: Pagos Pendientes
  const unpaidOrders = useMemo(() => {
    return orders
      .filter(o => !o.paymentStatus || o.paymentStatus === 'no-abonado')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  const totalUnpaid = useMemo(() => {
    return unpaidOrders.reduce((acc, o) => acc + o.total, 0);
  }, [unpaidOrders]);

  // ─── Tab definitions ───────────────────────────────────────────────────────

  const tabs: TabDefinition[] = [
    {
      id: 'pending',
      label: 'Órdenes Pendientes',
      icon: '⏳',
    },
    {
      id: 'shipping',
      label: 'Preparadas para Envío',
      icon: '📦',
    },
    {
      id: 'payment',
      label: 'Pagos Pendientes',
      icon: '💰',
    },
  ];

  // ─── Render table row ───────────────────────────────────────────────────────

  const renderTableRow = (order: any) => {
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

    const statusBadgeVariant: 'discount' | 'new' | 'outOfStock' = statusBadgeVariantMap[order.status] || 'new';
    const statusLabel = statusLabelMap[order.status] || order.status;

    const customerName = `${order.customer.firstName} ${order.customer.lastName}`;

    return (
      <tr key={order.id} className={styles.tableRow}>
        <td className={styles.tableCell}>{customerName}</td>
        <td className={styles.tableCell}>{formatDate(order.createdAt)}</td>
        <td className={styles.tableCell}>
          <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
        </td>
        <td className={styles.tableCellAmount}>{formatCurrency(order.total)}</td>
        <td className={styles.tableCellAction}>
          <Link to={`/admin/pedidos/${order.id}`}>
            <Button variant="primary" size="sm">Ver Detalles</Button>
          </Link>
        </td>
      </tr>
    );
  };

  // ─── Tab content renderers ──────────────────────────────────────────────────

  const renderPendingTab = () => {
    if (pendingOrders.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>✅ No hay órdenes pendientes de acción.</p>
        </div>
      );
    }

    return (
      <div className={styles.tabContent}>
        <div className={styles.tableWrapper}>
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
              {pendingOrders.map((order) => renderTableRow(order))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderShippingTab = () => {
    if (readyToShip.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>✅ No hay órdenes pendientes de envío.</p>
        </div>
      );
    }

    return (
      <div className={styles.tabContent}>
        <div className={styles.tableWrapper}>
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
              {readyToShip.map((order) => renderTableRow(order))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPaymentTab = () => {
    if (unpaidOrders.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>✅ Todos los pagos están al día.</p>
        </div>
      );
    }

    return (
      <div className={styles.tabContent}>
        <div className={styles.totalBar}>
          <span>Total pendiente:</span>
          <strong>{formatCurrency(totalUnpaid)}</strong>
        </div>
        <div className={styles.tableWrapper}>
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
              {unpaidOrders.map((order) => renderTableRow(order))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── Counts ─────────────────────────────────────────────────────────────────

  const pendingCount = pendingOrders.length;
  const shippingCount = readyToShip.length;
  const paymentCount = unpaidOrders.length;
  const totalCount = pendingCount + shippingCount + paymentCount;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className={styles.accordion}>
      {/* Accordion Header */}
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
            <span className={styles.titleIcon}>⚡</span>
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

      {/* Accordion Content */}
      {isExpanded && (
        <div className={styles.accordionContent}>
          <TabsWrapper tabs={tabs} defaultTab="pending">
            {renderPendingTab()}
            {renderShippingTab()}
            {renderPaymentTab()}
          </TabsWrapper>
        </div>
      )}
    </section>
  );
}
