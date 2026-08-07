import { useState, useMemo, useCallback } from 'react';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { TabsWrapper, type TabDefinition } from './TabsWrapper';
import { Badge } from './Badge/Badge';
import { Button } from './Button/Button';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { formatOrderCode } from '../../utils/orders';
import { ChevronDown, ChevronUp, Mail, Phone, ShoppingBag, Eye } from 'lucide-react';
import styles from './RequiredActionsAccordion.module.css';
import type { Order } from '../../context/AdminOrdersContext';

export default function RequiredActionsAccordion() {
  const { orders } = useAdminOrders();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedMobileCardId, setExpandedMobileCardId] = useState<string | null>(null);

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

  const toggleMobileCard = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMobileCardId(prev => (prev === id ? null : id));
  }, []);

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
    const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);
    const hasDeposit = order.has50PercentDeposit ?? false;
    const isCardExpanded = expandedMobileCardId === order.id;

    return (
      <div
        key={order.id}
        className={`${styles.mobileAccordionCard} ${isCardExpanded ? styles.mobileAccordionCardExpanded : ''}`}
      >
        {/* Cabecera Colapsada: Cliente + Total / Estado + Chevron */}
        <div
          className={styles.mobileAccordionHeader}
          onClick={(e) => toggleMobileCard(order.id, e)}
          role="button"
          tabIndex={0}
          aria-expanded={isCardExpanded}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleMobileCard(order.id, e as unknown as React.MouseEvent);
            }
          }}
        >
          <div className={styles.mobileHeaderMainContainer}>
            <div className={styles.mobileHeaderTopRow}>
              <div className={styles.mobileHeaderLeft}>
                <span className={styles.mobileClientName}>{customerName}</span>
                <span className={styles.mobileTotal}>{formatCurrency(order.total)}</span>
              </div>
              <div className={styles.mobileHeaderRight}>
                <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
                <span className={styles.mobileAccordionChevron}>
                  {isCardExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo Expandido: ID, Seña, Fecha, Contacto, Productos, Acciones */}
        {isCardExpanded && (
          <div className={styles.mobileAccordionBody}>
            <div className={styles.mobileMetaRowExpanded}>
              <div className={styles.mobileMetaGroupLeft}>
                <span className={styles.mobileCardIdExpanded}>
                  #{formatOrderCode(order.id)}
                </span>
                <span className={`${styles.depositBadge} ${hasDeposit ? styles.depositActive : styles.depositNone}`}>
                  {hasDeposit ? '50% seña' : 'Sin seña'}
                </span>
              </div>
              <div className={styles.mobileMetaGroupRight}>
                <span className={styles.mobileCardDateExpanded}>{formatDate(order.createdAt)}</span>
                <span className={styles.mobileMetaDot}>•</span>
                <span className={styles.mobileCardItemsCountExpanded}>{totalQty} {totalQty === 1 ? 'ítem' : 'ítems'}</span>
              </div>
            </div>

            {/* Datos de Contacto */}
            <div className={styles.mobileCustomerBox}>
              <div className={styles.mobileCustomerRow}>
                <Mail size={14} className={styles.mobileCustomerIcon} />
                <a href={`mailto:${order.customer.email}`} className={styles.mobileCustomerLink} onClick={e => e.stopPropagation()}>
                  {order.customer.email}
                </a>
              </div>
              {order.customer.phone && (
                <div className={styles.mobileCustomerRow}>
                  <Phone size={14} className={styles.mobileCustomerIcon} />
                  <a href={`tel:${order.customer.phone}`} className={styles.mobileCustomerLink} onClick={e => e.stopPropagation()}>
                    {order.customer.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Productos */}
            <div className={styles.mobileItemsBox}>
              <div className={styles.mobileItemsTitle}>
                <ShoppingBag size={14} />
                <span>DETALLE DE PRODUCTOS ({order.items.length})</span>
              </div>
              <ul className={styles.mobileItemsList}>
                {order.items.map((item, idx) => (
                  <li key={`${item.productId}-${idx}`} className={styles.mobileItemRow}>
                    <div className={styles.mobileItemInfo}>
                      <span className={styles.mobileItemName}>{item.productName}</span>
                      {item.variant && <span className={styles.mobileItemVariant}>{item.variant}</span>}
                    </div>
                    <div className={styles.mobileItemQtyPrice}>
                      <span className={styles.mobileItemQty}>x{item.quantity}</span>
                      <span className={styles.mobileItemSubtotal}>{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botón Acción */}
            <div className={styles.mobileAccordionActions}>
              <Link to={`/admin/pedidos/${order.id}`} className={styles.mobileFullDetailBtn}>
                <Eye size={16} />
                <span>Ver detalle completo</span>
              </Link>
            </div>
          </div>
        )}
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