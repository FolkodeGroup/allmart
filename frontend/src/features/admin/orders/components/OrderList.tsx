// ─────────────────────────────────────────────────────────────────────────────
// OrderList.tsx
// Lista de tarjetas de pedidos para vistas mobile (oculta en desktop via CSS).
// Equivalente móvil de OrdersTable; misma lógica, distinta presentación.
//
// Componentes:
//  - OrderList:        contenedor; itera pedidos y renderiza tarjetas
//  - OrderStatusMobile: sub-componente interno para cambio de estado en mobile
// ─────────────────────────────────────────────────────────────────────────────

import { formatDate, formatPrice } from '../utils/ordersHelpers';
import { OrderStatusTag } from './OrderStatusTag';
import { OrderStatusSelector } from './OrderStatusSelector';
import styles from '../AdminOrders.module.css';
import type { Order } from '../../../../context/AdminOrdersContext';
import { useAdminOrders } from '../../../../context/AdminOrdersContext';
import { useState } from 'react';
import React from 'react';
import toast from 'react-hot-toast';

/** Props de OrderList. Recibe la lista ya filtrada desde AdminOrders. */
interface OrderListProps {
  orders: Order[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDetail: (order: Order) => void;
}

/**
 * OrderList — lista de tarjetas para mobile.
 *
 * Solo visible en pantallas < 640px (controlado por CSS `.mobileList`).
 * Cada tarjeta muestra los datos clave del pedido y permite:
 *  - Seleccionar para acciones masivas (checkbox)
 *  - Cambiar el estado inline (OrderStatusMobile)
 *  - Abrir el modal de detalle (click en la tarjeta)
 *
 * La animación de entrada es escalonada: cada tarjeta aparece 40ms después
 * de la anterior, usando `animationDelay` en el style inline.
 */
export function OrderList({ orders, selectedIds, onSelect, onDetail }: OrderListProps) {
  return (
    <div className={styles.mobileList}>
      {orders.map((order, index) => {
        // Iniciales del cliente para el avatar (ej: "JP" para Juan Pérez)
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
            style={{
              marginBottom: 16,
              background: '#fff',
              animationDelay: `${index * 40}ms`,   // ← añadir index al .map()
            }}
          >
            {/* ── Top: checkbox + ID + fecha ── */}
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
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className={styles.mobileCardDate}>{formatDate(order.createdAt)}</span>
            </div>

            {/* ── Mid: avatar + nombre + email ── */}
            <div className={styles.mobileCardMid}>
              <div className={styles.mobileCardCustomer}>
                <div className={styles.mobileCardAvatar}>{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.mobileCardName}>{order.customer.firstName} {order.customer.lastName}</div>
                  <div className={styles.mobileCardEmail}>{order.customer.email}</div>
                </div>
              </div>
            </div>

            {/* ── Bottom: ítems + total + estado (con cambio inline) ── */}
            <div className={styles.mobileCardBottom}>
              <span className={styles.mobileCardItems}>{totalQty} ítem{totalQty !== 1 ? 's' : ''}</span>
              <span className={styles.mobileCardTotal}>{formatPrice(order.total)}</span>

              {/*
                OrderStatusMobile maneja su propio estado local para el cambio inline.
                stopPropagation se aplica dentro del componente para no abrir el modal.
              */}
              <OrderStatusMobile order={order} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * OrderStatusMobile — control de cambio de estado para tarjetas mobile.
 *
 * Lógica idéntica a la celda de estado en OrderItem (tabla desktop):
 *  1. Muestra OrderStatusTag en modo lectura.
 *  2. Al hacer clic → muestra OrderStatusSelector.
 *  3. Aplica optimistic update: actualiza `localStatus` antes de la API.
 *  4. Si la API falla → revierte `localStatus` al valor anterior.
 *
 * Es un componente interno; no se exporta fuera de este archivo.
 */
function OrderStatusMobile({ order }: { order: Order }) {
  const { updateOrderStatus } = useAdminOrders();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado local para optimistic update (misma lógica que OrderItem en tabla)
  const [localStatus, setLocalStatus] = useState(order.status);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza si el estado del pedido cambia externamente (ej: acción masiva)
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
          {loading && <span className={styles.statusLoading} style={{ marginLeft: 6 }}>⏳</span>}
        </span>
      )}
      {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{error}</div>}
    </span>
  );
}
