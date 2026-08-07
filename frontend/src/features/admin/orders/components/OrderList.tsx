import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Mail, Phone, ShoppingBag, Eye } from 'lucide-react';
import { formatDate, formatPrice } from '../utils/ordersHelpers';
import { OrderStatusTag } from './OrderStatusTag';
import { OrderStatusSelector } from './OrderStatusSelector';
import styles from '../AdminOrders.module.css';
import type { Order } from '../../../../context/AdminOrdersContext';
import { useAdminOrders } from '../../../../context/AdminOrdersContext';
import toast from 'react-hot-toast';
import { formatOrderCode } from '../../../../utils/orders';

interface OrderListProps {
  orders: Order[];
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onDetail: (order: Order) => void;
}

export function OrderList({ orders, onDetail }: OrderListProps) {
  // Estado local del acordeón: ID del pedido actualmente expandido (null si ninguno)
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
            {/* ── Cabecera Colapsada: Nombre Cliente + Total / Estado + Chevron ── */}
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
                  {/* Lado Izquierdo: Nombre de Cliente + Total */}
                  <div className={styles.mobileHeaderLeft}>
                    <span className={styles.mobileCardCustomerName}>
                      {order.customer.firstName} {order.customer.lastName}
                    </span>
                    <span className={styles.mobileCardTotalCompact}>
                      {formatPrice(order.total)}
                    </span>
                  </div>

                  {/* Lado Derecho: Estado + Chevron */}
                  <div className={styles.mobileHeaderRight}>
                    <OrderStatusTag status={order.status} />
                    <span className={styles.mobileAccordionChevron}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Cuerpo Expandido: ID, Seña, Fecha, Ítems, Contacto, Productos, Acciones ── */}
            {isExpanded && (
              <div className={styles.mobileAccordionBody}>
                {/* 1. Bar de Metadatos del Pedido (ID, Seña, Fecha, Cantidad de Ítems) */}
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

                {/* 2. Datos de Contacto del Cliente */}
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

                {/* 3. Detalle de Productos */}
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

                {/* 4. Acciones Inferiores */}
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
                    <span>Ver detalle completo</span>
                  </button>

                  <div
                    className={styles.mobileStatusSelectorWrap}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <OrderStatusMobile order={order} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderStatusMobile({ order }: { order: Order }) {
  const { updateOrderStatus } = useAdminOrders();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [localStatus, setLocalStatus] = useState(order.status);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalStatus(order.status);
  }, [order.status]);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === localStatus) return;
    setLoading(true);
    setError(null);
    const prev = localStatus;
    setLocalStatus(newStatus as typeof localStatus);
    try {
      await updateOrderStatus(order.id, newStatus as typeof localStatus);
      toast.success('Estado actualizado');
    } catch (e: unknown) {
      setLocalStatus(prev);
      setError(e instanceof Error ? e.message : 'Error al actualizar');
      toast.error('No se pudo actualizar el estado');
    } finally {
      setLoading(false);
      setEditing(false);
    }
  };

  return (
    <div style={{ position: 'relative', minWidth: 120 }}>
      {editing ? (
        <OrderStatusSelector
          value={localStatus}
          onChange={handleStatusChange}
          disabled={loading}
        />
      ) : (
        <button
          type="button"
          className={styles.statusTagTriggerBtn}
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          aria-label="Cambiar estado de pedido"
        >
          <OrderStatusTag status={localStatus} />
          {loading && <span className={styles.statusLoading}>⏳</span>}
        </button>
      )}
      {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{error}</div>}
    </div>
  );
}