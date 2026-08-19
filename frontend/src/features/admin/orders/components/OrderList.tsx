import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Mail, Phone, ShoppingBag, Eye } from 'lucide-react';
import { formatDate, formatPrice } from '../utils/ordersHelpers';
import { OrderStatusTag } from './OrderStatusTag';
import styles from '../AdminOrders.module.css';
import type { Order } from '../../../../context/AdminOrdersContext';
import { formatOrderCode } from '../../../../utils/orders';

interface OrderListProps {
  orders: Order[];
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onDetail: (order: Order) => void;
}

export function OrderList({ orders, onDetail }: OrderListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className={styles.mobileList}>
      {orders.map((order, index) => {
        const totalQty = order.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
        const hasDeposit = order.has50PercentDeposit ?? false;
        const isExpanded = expandedId === order.id;

        return (
          <div
            key={order.id}
            className={`${styles.mobileAccordionCard} ${isExpanded ? styles.mobileAccordionCardExpanded : ''}`}
            style={{
              animationDelay: `${index * 35}ms`,
            }}
          >
            {/* ── Cabecera Colapsada ── */}
            <div
              className={styles.mobileAccordionHeader}
              onClick={(e) => toggleExpand(order.id, e)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-label={`Pedido de ${order.customer.firstName} ${order.customer.lastName}, Total ${formatPrice(order.total)}, Estado ${order.status}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(order.id, e as unknown as React.MouseEvent);
                }
              }}
            >
              <div className={styles.mobileHeaderMainContainer}>
                <div className={styles.mobileHeaderTopRow}>
                  <div className={styles.mobileHeaderLeft}>
                    <span className={styles.mobileCardCustomerName}>
                      {order.customer.firstName} {order.customer.lastName}
                    </span>
                    <span className={styles.mobileCardTotalCompact}>
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  <div className={styles.mobileHeaderRight}>
                    <OrderStatusTag status={order.status} />
                    <span className={styles.mobileAccordionChevron}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Cuerpo Expandido ── */}
            {isExpanded && (
              <div className={styles.mobileAccordionBody}>
                {/* Metadatos */}
                <div className={styles.mobileMetaRowExpanded}>
                  <div className={styles.mobileMetaGroupLeft}>
                    <span className={styles.mobileCardIdExpanded}>
                      #{formatOrderCode(order.id)}
                    </span>
                    <span
                      className={`${styles.depositBadge} ${
                        hasDeposit ? styles.depositActive : styles.depositNone
                      }`}
                    >
                      {hasDeposit ? '50% seña' : 'Sin seña'}
                    </span>
                  </div>

                  <div className={styles.mobileMetaGroupRight}>
                    <span className={styles.mobileCardDateExpanded}>
                      {formatDate(order.createdAt)}
                    </span>
                    <span className={styles.mobileMetaDot}>•</span>
                    <span className={styles.mobileCardItemsCountExpanded}>
                      {totalQty} {totalQty === 1 ? 'ítem' : 'ítems'}
                    </span>
                  </div>
                </div>

                {/* Datos de Contacto */}
                <div className={styles.mobileCustomerBox}>
                  <div className={styles.mobileCustomerRow}>
                    <Mail size={14} className={styles.mobileCustomerIcon} />
                    <a
                      href={`mailto:${order.customer.email}`}
                      className={styles.mobileCustomerLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.customer.email}
                    </a>
                  </div>
                  {order.customer.phone && (
                    <div className={styles.mobileCustomerRow}>
                      <Phone size={14} className={styles.mobileCustomerIcon} />
                      <a
                        href={`tel:${order.customer.phone}`}
                        className={styles.mobileCustomerLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.customer.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Detalle de Productos */}
                <div className={styles.mobileItemsBox}>
                  <div className={styles.mobileItemsTitle}>
                    <ShoppingBag size={14} />
                    <span>DETALLE DE PRODUCTOS ({order.items.length})</span>
                  </div>
                  <ul className={styles.mobileItemsList}>
                    {order.items.map((item, i) => (
                      <li key={`${item.productId}-${i}`} className={styles.mobileItemRow}>
                        <div className={styles.mobileItemInfo}>
                          <span className={styles.mobileItemName}>{item.productName}</span>
                          {item.variant && (
                            <span className={styles.mobileItemVariant}>{item.variant}</span>
                          )}
                        </div>
                        <div className={styles.mobileItemQtyPrice}>
                          <span className={styles.mobileItemQty}>x{item.quantity}</span>
                          <span className={styles.mobileItemSubtotal}>
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Acciones */}
                <div className={styles.mobileAccordionActions}>
                  <button
                    type="button"
                    className={styles.mobileFullDetailBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDetail(order);
                    }}
                  >
                    <Eye size={16} />
                    <span>Ver detalle completo y avanzar pedido</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}