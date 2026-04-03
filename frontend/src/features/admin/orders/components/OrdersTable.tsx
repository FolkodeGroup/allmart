import { STATUS_LABELS, formatDate, formatPrice } from '../utils/ordersHelpers';
import styles from '../AdminOrders.module.css';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';
import type { Order } from '../../../../context/AdminOrdersContext';

interface OrdersTableProps {
  orders: Order[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDetail: (order: Order) => void;
}

export function OrdersTable({ orders, selectedIds, onSelect, onDetail }: OrdersTableProps) {
  return (
    <div className={styles.tableWrapper} style={{overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.03)'}}>
      <table className={styles.table} style={{minWidth: 900}}>
        <thead>
          <tr>
            <th style={{width: 48}}></th>
            <th style={{textAlign: 'left', padding: '18px 20px'}}>N° Pedido</th>
            <th style={{textAlign: 'left', padding: '18px 20px'}}>Fecha</th>
            <th style={{textAlign: 'left', padding: '18px 20px'}}>Cliente</th>
            <th style={{textAlign: 'left', padding: '18px 20px'}}>Productos</th>
            <th style={{textAlign: 'right', padding: '18px 20px'}}>Total</th>
            <th style={{textAlign: 'left', padding: '18px 20px'}}>Estado</th>
            <th style={{width: 80}}></th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <OrderItem
              key={order.id}
              order={order}
              selected={selectedIds.includes(order.id)}
              onSelect={onSelect}
              onDetail={onDetail}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// OrderItem reutilizable para la tabla
interface OrderItemProps {
  order: Order;
  selected: boolean;
  onSelect: (id: string) => void;
  onDetail: (order: Order) => void;
}

export function OrderItem({ order, selected, onSelect, onDetail }: OrderItemProps) {
  const totalQty = order.items.reduce((s: number, i: any) => s + i.quantity, 0);
  return (
    <tr
      className={styles.row}
      style={{ cursor: 'pointer', background: '#fff', transition: 'background 0.15s' }}
      onClick={() => onDetail(order)}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onDetail(order)}
      onMouseOver={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.06)')}
      onMouseOut={e => (e.currentTarget.style.background = '#fff')}
      onFocus={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.06)')}
      onBlur={e => (e.currentTarget.style.background = '#fff')}
    >
      <td style={{padding: '16px 12px'}}>
        <input
          type="checkbox"
          checked={selected}
          onChange={e => { e.stopPropagation(); onSelect(order.id); }}
          aria-label={`Seleccionar pedido ${order.id}`}
          onClick={e => e.stopPropagation()}
        />
      </td>
      <td style={{padding: '16px 20px', fontWeight: 700, fontSize: 17, color: '#2563eb', letterSpacing: 0.5}}>
        #{order.id.slice(0,8).toUpperCase()}
      </td>
      <td style={{padding: '16px 20px', color: '#64748b', fontSize: 15}}>{formatDate(order.createdAt)}</td>
      <td style={{padding: '16px 20px'}}>
        <div style={{fontWeight: 600, fontSize: 16, color: '#111827'}}>{order.customer.firstName} {order.customer.lastName}</div>
        <div style={{color: '#64748b', fontSize: 14}}>{order.customer.email}</div>
      </td>
      <td style={{padding: '16px 20px', color: '#334155', fontSize: 15}}>
        {totalQty} ítem{totalQty !== 1 ? 's' : ''}
      </td>
      <td style={{padding: '16px 20px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#059669'}}>
        {formatPrice(order.total)}
      </td>
      <td style={{padding: '16px 20px'}}>
        <span style={{
          display: 'inline-block',
          borderRadius: 8,
          padding: '4px 14px',
          fontWeight: 600,
          fontSize: 14,
          background:
            order.status === 'entregado' ? 'rgba(34,197,94,0.13)' :
            order.status === 'pendiente' ? 'rgba(251,191,36,0.13)' :
            order.status === 'cancelado' ? 'rgba(239,68,68,0.13)' :
            order.status === 'enviado' ? 'rgba(16,185,129,0.13)' :
            order.status === 'confirmado' ? 'rgba(59,130,246,0.13)' :
            order.status === 'en-preparacion' ? 'rgba(139,92,246,0.13)' :
            '#f3f4f6',
          color:
            order.status === 'entregado' ? '#22c55e' :
            order.status === 'pendiente' ? '#d97706' :
            order.status === 'cancelado' ? '#ef4444' :
            order.status === 'enviado' ? '#10b981' :
            order.status === 'confirmado' ? '#2563eb' :
            order.status === 'en-preparacion' ? '#8b5cf6' :
            '#6b7280',
          border: 'none',
          marginRight: order.paymentStatus === 'abonado' ? 8 : 0,
          minWidth: 90,
          textAlign: 'center',
        }}>
          {STATUS_LABELS[order.status]}
        </span>
        {order.paymentStatus === 'abonado' && (
          <span style={{
            display: 'inline-block',
            borderRadius: 8,
            padding: '4px 12px',
            fontWeight: 600,
            fontSize: 13,
            background: 'rgba(16,185,129,0.10)',
            color: '#128C48',
            marginLeft: 2,
          }}>
            ✓ Abonado
          </span>
        )}
      </td>
      <td style={{padding: '16px 8px', textAlign: 'center'}}>
        <Tooltip content="Ver detalle del pedido">
          <button
            className={styles.detailBtn}
            type="button"
            onClick={e => { e.stopPropagation(); onDetail(order); }}
            aria-label="Ver detalle del pedido"
            style={{background: '#f3f4f6', color: '#2563eb', borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '7px 16px', border: 'none', transition: 'background 0.15s'}}
            onMouseOver={e => (e.currentTarget.style.background = '#e0e7ef')}
            onMouseOut={e => (e.currentTarget.style.background = '#f3f4f6')}
            onFocus={e => (e.currentTarget.style.background = '#e0e7ef')}
            onBlur={e => (e.currentTarget.style.background = '#f3f4f6')}
          >
            Ver →
          </button>
        </Tooltip>
      </td>
    </tr>
  );
}
