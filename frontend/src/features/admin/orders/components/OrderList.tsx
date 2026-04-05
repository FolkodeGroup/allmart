import { formatDate, formatPrice } from '../utils/ordersHelpers';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStatusTag } from './OrderStatusTag';
import { OrderStatusSelector } from './OrderStatusSelector';
import styles from '../AdminOrders.module.css';
import type { Order } from '../../../../context/AdminOrdersContext';
import { useAdminOrders } from '../../../../context/AdminOrdersContext';
import { useState } from 'react';
import React from 'react';
import toast from 'react-hot-toast';

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
              <OrderStatusMobile order={order} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente para manejar el cambio de estado en mobile
function OrderStatusMobile({ order }: { order: Order }) {
  const { updateOrderStatus } = useAdminOrders();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(order.status);
  const [error, setError] = useState<string | null>(null);

  // Optimistic update: si cambia la prop, sincroniza
  React.useEffect(() => {
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
    } catch (e: any) {
      setLocalStatus(prev);
      setError(e?.message || 'Error al actualizar');
      toast.error('No se pudo actualizar el estado');
    } finally {
      setLoading(false);
      setEditing(false);
    }
  };

  return (
    <span style={{ position: 'relative', minWidth: 90, display: 'inline-block' }}>
      {editing ? (
        <OrderStatusSelector
          value={localStatus}
          onChange={handleStatusChange}
          disabled={loading}
        />
      ) : (
        <span
          tabIndex={0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onClick={e => { e.stopPropagation(); setEditing(true); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setEditing(true); } }}
          aria-label="Cambiar estado"
          role="button"
        >
          <OrderStatusTag status={localStatus} />
          {loading && <span className={styles.statusLoading} style={{marginLeft: 6}}>⏳</span>}
        </span>
      )}
      {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{error}</div>}
    </span>
  );
}
