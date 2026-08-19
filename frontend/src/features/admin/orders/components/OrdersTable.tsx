// ─────────────────────────────────────────────────────────────────────────────
// OrdersTable.tsx
// Tabla de pedidos para vistas de escritorio (oculta en mobile via CSS).
// Renderiza una fila por pedido con datos clave, seña y badge de estado de solo lectura.
// ─────────────────────────────────────────────────────────────────────────────


import { formatDate, formatPrice } from '../utils/ordersHelpers';
import { OrderStatusTag } from './OrderStatusTag';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';
import type { Order } from '../../../../context/AdminOrdersContext';
import { Button } from '../../../../components/ui/Button/Button';
import { formatOrderCode } from '../../../../utils/orders';
import styles from '../AdminOrders.module.css';

interface OrderItemProps {
  order: Order;
  selected: boolean;
  onSelect: (id: string) => void;
  onDetail: (order: Order) => void;
  index: number;
}

interface OrdersTableProps {
  orders: Order[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDetail: (order: Order) => void;
}

export function OrdersTable({ orders, selectedIds, onSelect, onDetail }: OrdersTableProps) {
  return (
    <div
      className={styles.tableWrapper}
      style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
    >
      <table className={styles.table} style={{ minWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>N° Pedido</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Fecha</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Cliente</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Productos</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Total</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Seña</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Estado</th>
            <th style={{ textAlign: 'left', padding: '18px 20px', width: 80 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <OrderItem
              key={order.id}
              order={order}
              selected={selectedIds.includes(order.id)}
              onSelect={onSelect}
              onDetail={onDetail}
              index={index}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OrderItem({ order, onDetail, index }: OrderItemProps) {
  const totalQty = order.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);

  return (
    <tr
      className={styles.row}
      style={{
        cursor: 'pointer',
        animation: 'fadeSlideUp 0.22s ease both',
        animationDelay: `${index * 35}ms`,
      }}
      onClick={() => onDetail(order)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDetail(order)}
    >
      {/* ID truncado a 8 caracteres para legibilidad */}
      <td className={styles.tdOrder}>
        #{formatOrderCode(order.id)}
      </td>
      <td className={styles.tdDate}>{formatDate(order.createdAt)}</td>
      <td className={styles.tdCustomer}>
        <div className={styles.customerTd}>
          {order.customer.firstName} {order.customer.lastName}
        </div>
        <div className={styles.tdEmail}>{order.customer.email}</div>
      </td>
      <td className={styles.tdProducts}>
        {totalQty} ítem{totalQty !== 1 ? 's' : ''}
      </td>
      <td className={styles.tdTotal}>
        {formatPrice(order.total)}
      </td>

      {/* Celda de Seña del 50% */}
      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
        {order.has50PercentDeposit ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: '#10b981',
              borderRadius: '12px',
              padding: '4px 10px',
            }}
          >
            50%
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
        )}
      </td>

      {/* Celda de Estado (Solo Lectura con Badge Oficial) */}
      <td style={{ padding: '16px 20px' }}>
        <OrderStatusTag status={order.status} />
      </td>

      {/* Botón de detalle */}
      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
        <Tooltip content="Ver detalle completo del pedido">
          <Button
            variant="secondary"
            size="sm"
            aria-label={`Ver detalle del pedido #${formatOrderCode(order.id)}`}
          >
            Ver →
          </Button>
        </Tooltip>
      </td>
    </tr>
  );
}