// ─────────────────────────────────────────────────────────────────────────────
// OrdersTable.tsx
// Tabla de pedidos para vistas de escritorio (oculta en mobile via CSS).
// Renderiza una fila por pedido con selección, datos clave y cambio de estado inline.
//
// Componentes exportados:
//  - OrdersTable: contenedor de la tabla; itera y delega a OrderItem
//  - OrderItem:   fila individual con lógica de estado optimista
// ─────────────────────────────────────────────────────────────────────────────

import { formatDate, formatPrice } from '../utils/ordersHelpers';
import { OrderStatusTag } from './OrderStatusTag';
import { OrderStatusSelector } from './OrderStatusSelector';
import React, { useState } from 'react';
import { useAdminOrders } from '../../../../context/AdminOrdersContext';
import toast from 'react-hot-toast';
import styles from '../AdminOrders.module.css';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';
import type { Order } from '../../../../context/AdminOrdersContext';
import { Button } from '../../../../components/ui/Button/Button';
import { formatOrderCode } from '../../../../utils/orders';

/**
 * Props de OrderItem.
 * @param index - Posición en la lista; se usa para escalonar la animación de entrada.
 */
interface OrderItemProps {
  order: Order;
  selected: boolean;
  onSelect: (id: string) => void;
  onDetail: (order: Order) => void;
  index: number;
}

/** Props de OrdersTable. Recibe la lista ya filtrada desde AdminOrders. */
interface OrdersTableProps {
  orders: Order[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDetail: (order: Order) => void;
}

/**
 * OrdersTable — tabla principal de pedidos para desktop.
 *
 * Delega el renderizado de cada fila a OrderItem, pasando el `index`
 * para que la animación de entrada sea escalonada.
 *
 * Solo visible en pantallas ≥ 640px (controlado por CSS `.tableWrapper`).
 */
export function OrdersTable({ orders, selectedIds, onSelect, onDetail }: OrdersTableProps) {
  return (
    <div className={styles.tableWrapper} style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <table className={styles.table} style={{ minWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>N° Pedido</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Fecha</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Cliente</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Productos</th>
            <th style={{ textAlign: 'left', padding: '18px 20px' }}>Total</th>
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

// OrderItem reutilizable para la tabla
interface OrderItemProps {
  order: Order;
  selected: boolean;
  onSelect: (id: string) => void;
  onDetail: (order: Order) => void;
}

/**
 * OrderItem — fila individual de la tabla de pedidos.
 *
 * Gestiona su propio estado de edición de status (optimistic update):
 *  1. El usuario hace clic en el badge de estado → aparece OrderStatusSelector.
 *  2. Al seleccionar un nuevo estado → se llama updateOrderStatus del contexto.
 *  3. Si la API falla → se revierte `localStatus` al valor anterior.
 *
 * El click en la fila completa abre el modal de detalle (onDetail),
 * excepto en la celda del estado donde el click se propaga de forma controlada.
 */

export function OrderItem({ order, onDetail, index }: OrderItemProps) {
  const totalQty = order.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0); // Cantidad total de ítems sumando todas las líneas del pedido

  const { updateOrderStatus } = useAdminOrders();

  // `editing`: controla si se muestra el selector de estado o el badge de solo lectura
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * `localStatus`: copia local del estado del pedido para optimistic update.
   * Se sincroniza con `order.status` vía useEffect para mantener consistencia
   * si el pedido se actualiza desde otro lugar (ej: acción masiva).
   */
  const [localStatus, setLocalStatus] = useState(order.status);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza el estado local si la prop cambia externamente
  React.useEffect(() => {
    setLocalStatus(order.status);
  }, [order.status]);

  /**
   * handleStatusChange — actualiza el estado del pedido con optimistic update.
   *
   * Flujo:
   *  1. Actualiza `localStatus` inmediatamente (UI responde al instante).
   *  2. Llama a la API via contexto.
   *  3. Si falla: revierte `localStatus` y muestra error.
   */
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
    <tr
      className={styles.row}
      style={{
        cursor: 'pointer',
        animation: `fadeSlideUp 0.22s ease both`,
        animationDelay: `${index * 35}ms`,
      }}
      onClick={() => onDetail(order)}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onDetail(order)}
    >

      {/* ID truncado a 8 caracteres para legibilidad */}
      <td className={styles.tdOrder} >
        #{formatOrderCode(order.id)}
      </td>
      <td className={styles.tdDate}>{formatDate(order.createdAt)}</td>
      <td className={styles.tdCustomer}>
        <div className={styles.customerTd}>{order.customer.firstName} {order.customer.lastName}</div>
        <div className={styles.tdEmail}>{order.customer.email}</div>
      </td>
      <td className={styles.tdProducts}>
        {totalQty} ítem{totalQty !== 1 ? 's' : ''}
      </td>
      <td className={styles.tdTotal} >
        {formatPrice(order.total)}
      </td>

      {/*
        Celda de estado: stopPropagation en la celda evita abrir el modal
        al hacer clic en el selector o el badge.
        Alterna entre OrderStatusTag (solo lectura) y OrderStatusSelector (edición).
      */}
      <td style={{ padding: '16px 20px', position: 'relative', minWidth: 120 }} onClick={e => e.stopPropagation()}>
        {editing ? (
          <OrderStatusSelector
            value={localStatus}
            onChange={handleStatusChange}
            disabled={loading}
          />
        ) : (
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 90 }}
            tabIndex={0}
            onClick={e => { e.stopPropagation(); setEditing(true); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setEditing(true); } }}
            aria-label="Cambiar estado"
            role="button"
          >
            <OrderStatusTag status={localStatus} />
            {loading && <span className={styles.statusLoading} style={{ marginLeft: 6 }}>⏳</span>}
          </span>
        )}
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{error}</div>}
      </td>

      {/* Botón de detalle: stopPropagation para no disparar el onClick del <tr> */}
      <td style={{ padding: '16px 8px', textAlign: 'center' }}>
        <Tooltip content="Ver detalle del pedido">
          <Button variant="secondary" size="sm" aria-label="Ver detalle del pedido">Ver →</Button>
        </Tooltip>
      </td>
    </tr>
  );
}
