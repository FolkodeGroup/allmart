import { useState, useEffect, useRef } from 'react';
import { useAdminOrders } from '../../../../context/AdminOrdersContext';
import { useAdminAuth } from '../../../../context/AdminAuthContext';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';
import { paymentClass, formatDateTime, formatPrice, PAYMENT_LABELS } from '../utils/ordersHelpers';
import toast from 'react-hot-toast';
import type { Order, OrderStatus, PaymentStatus } from '../../../../context/AdminOrdersContext';
import styles from './OrderDetailContent.module.css';
import { logAdminActivity } from '../../../../services/adminActivityLogService';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStatusSelector } from './OrderStatusSelector';
import { OrderTimeline } from './OrderTimeline';
import { MessageSquare, Phone, Mail } from 'lucide-react';
import { formatOrderLabel } from '../../../../utils/orders';

interface OrderDetailContentProps {
  order: Order;
  onClose?: () => void;
}

export const OrderDetailContent = ({ order, onClose }: OrderDetailContentProps) => {
  const { updateOrderStatus, updateOrder, deleteOrder, markAsPaid, toggleDeposit } = useAdminOrders();
  const { can } = useAdminAuth();

  const [notes, setNotes] = useState(order.notes ?? '');
  const [savedNotesDisplay, setSavedNotesDisplay] = useState(order.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(order.status);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [saveNotesLoading, setSaveNotesLoading] = useState(false);

  const originalStatusRef = useRef(order.status);
  const originalNotesRef = useRef(order.notes ?? '');

  // Sincronizar estado cuando la prop order cambie externamente
  useEffect(() => {
    setNotes(order.notes ?? '');
    setSavedNotesDisplay(order.notes ?? '');
    setPendingStatus(order.status);
    originalStatusRef.current = order.status;
    originalNotesRef.current = order.notes ?? '';
  }, [order]);

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
      toast.error(`No se pudo actualizar el pedido`);
      setPendingStatus(prev);
    } finally {
      setStatusLoading(false);
    }
  };

  const currentStatus = order.status;

  const handleSaveNotes = async () => {
    if (saveNotesLoading) return;
    setSaveNotesLoading(true);
    try {
      await updateOrder(order.id, { notes: notes.trim() });
      originalNotesRef.current = notes.trim();
      setSavedNotesDisplay(notes.trim());
      toast.success('Notas internas guardadas con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudieron guardar las notas: ${message}`);
    } finally {
      setSaveNotesLoading(false);
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

  const handleToggleDeposit = async () => {
    try {
      setDepositLoading(true);
      await toggleDeposit(order.id);
      const action = order.has50PercentDeposit ? 'desactivada' : 'activada';
      toast.success(`Seña del 50% ${action}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al actualizar seña: ${message}`);
    } finally {
      setDepositLoading(false);
    }
  };

  const initials = `${order.customer?.firstName?.[0] ?? ''}${order.customer?.lastName?.[0] ?? ''}`;

  // Cálculos financieros para el Resumen
  const halfTotal = order.total / 2;
  const isDepositActive = order.has50PercentDeposit ?? false;
  const remainingAmount = isAbonado ? 0 : isDepositActive ? halfTotal : order.total;

  return (
    <div className={styles.detailContent}>
      {/* ── COLUMNA PRINCIPAL (65% en Desktop) ── */}
      <div className={styles.mainColumn}>
        {/* ── Sección 1: Estado del Pedido ── */}
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Estado del Pedido</h3>
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
            {statusLoading && <span className={styles.statusLoading}>⏳</span>}
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

        {/* ── Sección 2: Tabla de Productos ── */}
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>
            Productos · {order.items.reduce((s, i) => s + i.quantity, 0)} ítems
          </h3>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th className={styles.tdLeft}>Producto</th>
                <th className={styles.tdCenter}>Cant.</th>
                <th className={styles.tdRight}>P. unit.</th>
                <th className={styles.tdRight}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={`${item.productId}-${item.productSkuId ?? 'base'}-${item.productName}`}>
                  <td data-label="Producto" className={styles.tdProduct}>
                    <div className={styles.tdProductName}>{item.productName}</div>
                    {(item.variant || item.sku) && (
                      <div className={styles.itemVariant}>
                        {item.variant || item.sku}
                        {item.variant && item.sku ? ` · ${item.sku}` : ''}
                      </div>
                    )}
                  </td>
                  <td data-label="Cant." className={styles.tdCenter}>{item.quantity}</td>
                  <td data-label="P. unit." className={styles.tdRight}>{formatPrice(item.unitPrice)}</td>
                  <td data-label="Subtotal" className={styles.tdRight}>{formatPrice(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className={styles.totalLabel}>Total del Pedido</td>
                <td className={`${styles.tdRight} ${styles.totalValue}`}>{formatPrice(order.total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* ── Sección 3: Historial de Estados ── */}
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Historial de Estados</h3>
          <OrderTimeline history={order.statusHistory ?? []} currentStatus={order.status} />
        </section>

        {/* ── Sección 4: Notas Internas con Vista de Persistencia ── */}
        {can('orders.edit') && (
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Notas Internas</h3>

            {savedNotesDisplay ? (
              <div className={styles.savedNotesBox}>
                <div className={styles.savedNotesHeader}>
                  <span className={styles.savedNotesTitle}>Nota guardada actualmente:</span>
                </div>
                <p className={styles.savedNotesText}>{savedNotesDisplay}</p>
              </div>
            ) : null}

            <textarea
              className={styles.notesInput}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Escribí notas internas sobre este pedido (ej: comprobante de transferencia validado)..."
            />

            <button
              className={styles.saveNotesBtn}
              type="button"
              onClick={handleSaveNotes}
              disabled={saveNotesLoading}
            >
              {saveNotesLoading ? 'Guardando...' : 'Guardar notas'}
            </button>
          </section>
        )}
      </div>

      {/* ── COLUMNA LATERAL (35% en Desktop) ── */}
      <div className={styles.sideColumn}>
        {/* ── Tarjeta CRM: Datos del Cliente ── */}
        <section className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Datos del Cliente</h3>
          <div className={styles.customerCard}>
            <div className={styles.customerAvatar}>{initials}</div>
            <div className={styles.customerInfo}>
              <span className={styles.customerFullName}>
                {order.customer.firstName} {order.customer.lastName}
              </span>
              <a href={`mailto:${order.customer.email}`} className={styles.customerEmailText}>
                {order.customer.email}
              </a>
              {order.customer.phone && (
                <a href={`tel:${order.customer.phone}`} className={styles.customerPhoneText}>
                  <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {order.customer.phone}
                </a>
              )}
            </div>
          </div>

          <div className={styles.customerActions}>
            <a
              href={`mailto:${order.customer.email}?subject=Pedido%20${formatOrderLabel(order.id)}`}
              className={styles.customerActionBtn}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={14} /> Email
            </a>
            {order.customer.phone && (
              <a
                href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}`}
                className={styles.customerActionBtn}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare size={14} /> WhatsApp
              </a>
            )}
          </div>
        </section>

        {/* ── Tarjeta Financiera: Estado del Pago y Seña ── */}
        {can('orders.markPaid') && (
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Resumen Financiero y Pago</h3>

            <div className={styles.financialGrid}>
              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Estado del cobro</span>
                <span className={`${styles.paymentBadge} ${paymentClass(paymentStatus, styles)}`}>
                  {isAbonado ? '✓' : '○'} {PAYMENT_LABELS[paymentStatus]}
                </span>
              </div>

              {isAbonado && order.paidAt && (
                <div className={styles.financialRow}>
                  <span className={styles.financialLabel}>Fecha de pago</span>
                  <span className={styles.paidAt}>{formatDateTime(order.paidAt)}</span>
                </div>
              )}

              <div className={styles.financialDivider} />

              <div className={styles.financialRow}>
                <span className={styles.financialLabel}>Total Pedido</span>
                <span className={styles.financialValue}>{formatPrice(order.total)}</span>
              </div>

              {!isAbonado && (
                <div className={styles.financialRow}>
                  <span className={styles.financialLabel}>Restante a cobrar</span>
                  <span className={`${styles.financialValue} ${styles.financialHighlight}`}>
                    {formatPrice(remainingAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Control de Seña 50% */}
            <div className={styles.depositBox}>
              <div className={styles.depositLabelGroup}>
                <span className={styles.depositLabel}>Seña del 50%</span>
                {isDepositActive && (
                  <span className={styles.depositActiveBadge}>
                    Registrada
                  </span>
                )}
              </div>
              <button
                className={`${styles.depositBtn} ${isDepositActive ? styles.depositBtnActive : ''}`}
                type="button"
                onClick={handleToggleDeposit}
                disabled={depositLoading || isAbonado}
              >
                {depositLoading ? '...' : isDepositActive ? '✓ 50% Señado' : 'Activar 50%'}
              </button>
            </div>

            {/* Acción Marcar como Abonado */}
            {!isAbonado && (
              <div className={styles.whatsappActions}>
                {!confirmPaid ? (
                  <button
                    className={styles.whatsappBtn}
                    type="button"
                    onClick={() => setConfirmPaid(true)}
                  >
                    ✓ Marcar como abonado
                  </button>
                ) : (
                  <div className={styles.confirmPaidBox}>
                    <span className={styles.confirmPaidText}>
                      ¿Confirmar cobro completo del pedido?
                    </span>
                    <div className={styles.confirmPaidActions}>
                      <button
                        className={styles.whatsappBtnConfirm}
                        type="button"
                        onClick={async () => { await handleMarkAsPaid(order.id); setConfirmPaid(false); }}
                      >
                        Sí, confirmar
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

        {/* ── Tarjeta: Zona Peligrosa ── */}
        {can('orders.delete') && (
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Zona Peligrosa</h3>
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
    </div>
  );
};