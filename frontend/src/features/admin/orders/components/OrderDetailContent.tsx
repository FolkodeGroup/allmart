// ─────────────────────────────────────────────────────────────────────────────
// OrderDetailContent.tsx
// Componente reutilizable que renderiza el contenido detallado de un pedido.
// Utilizado tanto en OrderDetailPage como en OrderDetailModal.
//
// Responsabilidades:
//  - Renderizar todas las secciones del pedido (estado, pago, cliente, productos, etc.)
//  - Manejar la edición de estado, pago y notas
//  - Gestionar los handlers de actualización
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useAdminOrders } from '../../../../context/AdminOrdersContext';
import { useAdminAuth } from '../../../../context/AdminAuthContext';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';
import { paymentClass, formatDateTime, formatPrice, PAYMENT_LABELS } from '../utils/ordersHelpers';
import toast from 'react-hot-toast';
import type { Order, OrderStatus, PaymentStatus } from '../../../../context/AdminOrdersContext';
import styles from '../AdminOrders.module.css';
import { logAdminActivity } from '../../../../services/adminActivityLogService';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStatusSelector } from './OrderStatusSelector';
import { OrderTimeline } from './OrderTimeline';

interface OrderDetailContentProps {
  order: Order;
  onClose?: () => void;
}

export const OrderDetailContent = ({ order, onClose }: OrderDetailContentProps) => {
  const { updateOrderStatus, updateOrder, deleteOrder, markAsPaid } = useAdminOrders();
  const { can } = useAdminAuth();

  // ── Estado local ────────────────────────────────────────────────────
  const [notes, setNotes] = useState(order.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(order.status);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // ── Refs para detectar cambios sin guardar ──────────────────────────
  const originalStatusRef = useRef(order.status);
  const originalNotesRef = useRef(order.notes ?? '');

  const isDirty =
    notes !== originalNotesRef.current ||
    pendingStatus !== originalStatusRef.current;

  const { setIsDirty: setGlobalDirty } = useUnsavedChanges();

  useEffect(() => {
    setGlobalDirty(isDirty);
  }, [isDirty, setGlobalDirty]);

  const paymentStatus: PaymentStatus = order.paymentStatus ?? 'no-abonado';
  const isAbonado = paymentStatus === 'abonado';
  const hasStatusChange = pendingStatus !== order.status;

  const auth = useAdminAuth();
  const userEmail = (auth && (auth.user as string)) || 'desconocido';

  // ── Handlers ────────────────────────────────────────────────────────

  const handleStatusApply = async () => {
    setStatusLoading(true);
    setStatusError(null);
    const prev = order.status;
    try {
      await updateOrderStatus(order.id, pendingStatus, statusNote.trim() || undefined);
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'update-status',
        entity: 'order',
        entityId: order.id,
        details: { from: prev, to: pendingStatus, note: statusNote },
      });
      toast.success('Estado del pedido actualizado con éxito');
      originalStatusRef.current = pendingStatus;
      setStatusNote('');
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error(`No se pudo actualizar el pedido: ${statusError}`);
      setPendingStatus(prev);
    } finally {
      setStatusLoading(false);
    }
  };

  const currentStatus = order.status;

  const handleSaveNotes = async () => {
    try {
      await updateOrder(order.id, { notes });
      originalNotesRef.current = notes;
      toast.success('Notas guardadas con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudieron guardar las notas: ${message}`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(order.id);
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'delete',
        entity: 'order',
        entityId: order.id,
        details: {},
      });
      toast.success('Pedido eliminado con éxito');
      onClose?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudo eliminar el pedido: ${message}`);
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      await markAsPaid(orderId);
      toast.success('Pedido marcado como abonado');
    } catch {
      toast.error('Error al marcar como abonado');
    }
  };

  // Iniciales del cliente para el avatar
  const initials = `${order.customer?.firstName?.[0] ?? ''}${order.customer?.lastName?.[0] ?? ''}`;

  return (
    <div className={styles.detailContent}>
      {/* ── Sección: Estado del pedido ── */}
      <section className={styles.detailSection}>
        <h3 className={styles.detailSectionTitle}>Estado del pedido</h3>
        <div className={styles.statusRow}>
          <OrderStatusBadge status={pendingStatus} />
          {can('orders.edit') && (
            <OrderStatusSelector
              value={pendingStatus}
              onChange={s => {
                const newStatus = s as OrderStatus;
                setPendingStatus(newStatus);
                const newIsDirty = newStatus !== originalStatusRef.current || notes !== originalNotesRef.current;
                setGlobalDirty(newIsDirty);
              }}
              disabled={statusLoading}
            />
          )}
          {statusLoading && <span className={styles.statusLoading} style={{ marginLeft: 6 }}>⏳</span>}
        </div>
        {can('orders.edit') && hasStatusChange && (
          <div className={styles.statusChangeBox}>
            <input
              className={styles.statusNoteInput}
              type="text"
              placeholder="Nota del cambio (opcional, ej: enviado por OCA #123)..."
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              maxLength={120}
              disabled={statusLoading}
            />
            <div className={styles.statusChangeActions}>
              <button
                className={styles.applyStatusBtn}
                type="button"
                onClick={handleStatusApply}
                disabled={statusLoading}
              >
                {statusLoading ? 'Guardando...' : 'Guardar cambio'}
              </button>
              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => { setPendingStatus(currentStatus); setStatusNote(''); }}
                disabled={statusLoading}
              >
                Cancelar
              </button>
            </div>
            {statusError && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>{statusError}</div>}
          </div>
        )}
      </section>

      {/* ── Sección: Historial de estados ── */}
      <section className={styles.detailSection}>
        <h3 className={styles.detailSectionTitle}>Historial de estados</h3>
        <OrderTimeline history={order.statusHistory ?? []} currentStatus={order.status} />
      </section>

      {/* ── Sección: Pago ── */}
      {can('orders.markPaid') && (
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Pago</h3>
          <div className={styles.paymentRow}>
            <span className={`${styles.paymentBadge} ${paymentClass(paymentStatus, styles)}`}>
              {isAbonado ? '✓' : '○'} {PAYMENT_LABELS[paymentStatus]}
            </span>
            {isAbonado && order.paidAt && (
              <span className={styles.paidAt}>
                Confirmado el {formatDateTime(order.paidAt)}
              </span>
            )}
          </div>
          {!isAbonado && (
            <div className={styles.whatsappActions}>
              {!confirmPaid ? (
                <button
                  className={styles.whatsappBtn}
                  type="button"
                  onClick={() => setConfirmPaid(true)}
                >
                  <span className={styles.whatsappIcon}>💬</span>
                  Marcar como abonado
                </button>
              ) : (
                <div className={styles.confirmPaidBox}>
                  <span className={styles.confirmPaidText}>
                    ¿Confirmar que el cliente abonó este pedido vía WhatsApp?
                  </span>
                  <div className={styles.confirmPaidActions}>
                    <button
                      className={styles.whatsappBtnConfirm}
                      type="button"
                      onClick={async () => { await handleMarkAsPaid(order.id); setConfirmPaid(false); }}
                    >
                      ✓ Sí, confirmar pago
                    </button>
                    <button
                      className={styles.cancelBtn}
                      type="button"
                      onClick={() => setConfirmPaid(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Sección: Datos del cliente ── */}
      <section className={styles.detailSection}>
        <h3 className={styles.detailSectionTitle}>Datos del cliente</h3>
        <div className={styles.customerCard}>
          <div className={styles.customerAvatar}>{initials}</div>
          <div className={styles.customerInfo}>
            <span className={styles.customerFullName}>
              {order.customer.firstName} {order.customer.lastName}
            </span>
            <span className={styles.customerEmailText}>{order.customer.email}</span>
          </div>
        </div>
      </section>

      {/* ── Sección: Productos ── */}
      <section className={styles.detailSection}>
        <h3 className={styles.detailSectionTitle}>
          Productos · {order.items.reduce((s, i) => s + i.quantity, 0)} ítems
        </h3>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Producto</th>
              <th className={styles.tdCenter}>Cant.</th>
              <th className={styles.tdRight}>P. unit.</th>
              <th className={styles.tdRight}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.productId + item.productName}>
                <td>{item.productName}</td>
                <td className={styles.tdCenter}>{item.quantity}</td>
                <td className={styles.tdRight}>{formatPrice(item.unitPrice)}</td>
                <td className={styles.tdRight}>{formatPrice(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className={styles.totalLabel}>Total</td>
              <td className={`${styles.tdRight} ${styles.totalValue}`}>{formatPrice(order.total)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* ── Sección: Notas internas ── */}
      {can('orders.edit') && (
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Notas internas</h3>
          <textarea
            className={styles.notesInput}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Agregá notas internas sobre este pedido..."
          />
          <button
            className={styles.saveNotesBtn}
            type="button"
            onClick={handleSaveNotes}
          >
            Guardar notas
          </button>
        </section>
      )}

      {/* ── Sección: Zona peligrosa ── */}
      {can('orders.delete') && (
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Zona peligrosa</h3>
          <div className={styles.dangerSection}>
            {!confirmDelete ? (
              <Tooltip content="Eliminar este pedido. Esta acción no se puede deshacer.">
                <button
                  className={styles.deleteBtn}
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Eliminar pedido"
                >
                  🗑️ Eliminar este pedido
                </button>
              </Tooltip>
            ) : (
              <div className={styles.confirmDelete}>
                <span>¿Seguro que querés eliminar este pedido? Esta acción no se puede deshacer.</span>
                <div className={styles.confirmActions}>
                  <button
                    className={styles.deleteConfirmBtn}
                    type="button"
                    onClick={handleDelete}
                  >
                    Sí, eliminar
                  </button>
                  <button
                    className={styles.cancelBtn}
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
