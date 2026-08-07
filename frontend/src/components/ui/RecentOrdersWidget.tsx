import { useState, useCallback } from 'react';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { Container } from './Container/Container';
import { Badge } from './Badge/Badge';
import styles from './RecentOrdersWidget.module.css';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { formatOrderCode } from '../../utils/orders';
import { ChevronDown, ChevronUp, Mail, Phone, ShoppingBag, Eye } from 'lucide-react';
import type { Order } from '../../context/AdminOrdersContext';

const STATUS_COLORS = {
  pendiente: 'discount' as const,
  confirmado: 'new' as const,
  'en-preparacion': 'new' as const,
  enviado: 'new' as const,
  entregado: 'new' as const,
  cancelado: 'outOfStock' as const,
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  'en-preparacion': 'En preparación',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function RecentOrdersWidget() {
  const { orders } = useAdminOrders();
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recentOrders = sortedOrders.slice(0, 5);
  const [expandedMobileCardId, setExpandedMobileCardId] = useState<string | null>(null);

  const toggleMobileCard = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMobileCardId(prev => (prev === id ? null : id));
  }, []);

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

  const renderMobileCard = (order: Order) => {
    const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);
    const hasDeposit = order.has50PercentDeposit ?? false;
    const isCardExpanded = expandedMobileCardId === order.id;
    const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
    const statusLabel = STATUS_LABELS[order.status] || order.status;

    return (
      <div
        key={order.id}
        className={`${styles.mobileAccordionCard} ${isCardExpanded ? styles.mobileAccordionCardExpanded : ''}`}
      >
        {/* Cabecera Colapsada */}
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
                <Badge variant={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] ?? 'new'}>
                  {statusLabel}
                </Badge>
                <span className={styles.mobileAccordionChevron}>
                  {isCardExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo Expandido */}
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

            {/* Contacto */}
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

            {/* Acción */}
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

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Pedidos Recientes</h3>

      {/* Desktop Table View (>= 768px) */}
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
                    {STATUS_LABELS[order.status] || order.status}
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

      {/* Mobile Cards Accordion List (< 768px) */}
      <div className={styles.mobileCardsList}>
        {recentOrders.map(order => renderMobileCard(order))}
      </div>
    </div>
  );
}