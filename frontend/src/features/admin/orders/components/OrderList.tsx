import { STATUS_LABELS, formatDate, formatPrice, statusClass } from '../utils/ordersHelpers';
import styles from '../AdminOrders.module.css';
import type { Order } from '../../../../context/AdminOrdersContext';

interface OrderListProps {
  orders: Order[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDetail: (order: Order) => void;
}

export function OrderList({ orders, selectedIds, onSelect, onDetail }: OrderListProps) {
  return (
    <div className={styles.mobileList}>
      {orders.map(order => {
        const initials = `${order.customer.firstName[0] ?? ''}${order.customer.lastName[0] ?? ''}`;
        const totalQty = order.items.reduce((s: number, i: any) => s + i.quantity, 0);
        return (
          <div
            key={order.id}
            className={styles.mobileCard}
            onClick={() => onDetail(order)}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onDetail(order)}
            style={{ marginBottom: 16, background: '#fff' }}
          >
            <div className={styles.mobileCardTop}>
              <input
                type="checkbox"
                checked={selectedIds.includes(order.id)}
                onChange={e => { e.stopPropagation(); onSelect(order.id); }}
                aria-label={`Seleccionar pedido ${order.id}`}
                onClick={e => e.stopPropagation()}
                style={{ marginRight: 8, minWidth: 24, minHeight: 24 }}
              />
              <span className={styles.mobileCardId}>
                #{order.id.slice(0,8).toUpperCase()}
              </span>
              <span className={styles.mobileCardDate}>{formatDate(order.createdAt)}</span>
            </div>
            <div className={styles.mobileCardMid}>
              <div className={styles.mobileCardCustomer}>
                <div className={styles.mobileCardAvatar}>{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.mobileCardName}>{order.customer.firstName} {order.customer.lastName}</div>
                  <div className={styles.mobileCardEmail}>{order.customer.email}</div>
                </div>
              </div>
            </div>
            <div className={styles.mobileCardBottom}>
              <span className={styles.mobileCardItems}>{totalQty} ítem{totalQty !== 1 ? 's' : ''}</span>
              <span className={styles.mobileCardTotal}>{formatPrice(order.total)}</span>
              <span className={styles.statusBadge + ' ' + statusClass(order.status, styles)}>{STATUS_LABELS[order.status]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
