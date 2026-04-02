import { Tooltip } from '../../../components/ui/Tooltip/Tooltip';
import { useState, useCallback } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useAdminOrders } from '../../../context/AdminOrdersContext';
import type { Order, OrderStatus, PaymentStatus, OrderHistoryEntry } from '../../../context/AdminOrdersContext';
import { STATUS_LABELS, PAYMENT_LABELS, paymentClass, STATUS_OPTIONS, statusClass, formatDateTime, STATUS_ICONS, formatPrice } from './utils/ordersHelpers';
import toast from 'react-hot-toast';
import { logAdminActivity } from '../../../services/adminActivityLogService';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminOrders.module.css';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { OrdersHeader } from './components/OrdersHeader';
import { OrdersFilters } from './components/OrdersFilters';
import { OrdersTable } from './components/OrdersTable';
import { OrderList } from './components/OrderList';
import { useOrders } from './hooks/useOrders';
import { useOrdersFilters } from './hooks/useOrdersFilters';

// Helpers y constantes extraídos a utils/ordersHelpers.ts

/* ── Componente Timeline de estados ─────────────────────────────── */
function OrderTimeline({ history, currentStatus }: { history: OrderHistoryEntry[]; currentStatus: OrderStatus }) {
  if (history.length === 0) {
    return (
      <p className={styles.timelineEmpty}>No hay registros de cambios de estado aún.</p>
    );
  }
  const sorted: OrderHistoryEntry[] = [...history].reverse();
  return (
    <ol className={styles.timeline}>
      {sorted.map((entry: OrderHistoryEntry, idx: number) => {
        const isCurrent = entry.status === currentStatus && idx === 0;
        const isLast = idx === sorted.length - 1;
        return (
          <li key={entry.changedAt + idx} className={`${styles.timelineItem} ${isCurrent ? styles.timelineItemCurrent : ''}`}>
            <div className={styles.timelineDotWrap}>
              <span className={styles.timelineDot}>
                {STATUS_ICONS[entry.status]}
              </span>
              {!isLast && <span className={styles.timelineLine} />}
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={`${styles.statusBadge} ${statusClass(entry.status, styles)}`}>
                  {STATUS_LABELS[entry.status]}
                </span>
                {isCurrent && (
                  <span className={styles.timelineCurrentTag}>Estado actual</span>
                )}
              </div>
              <time className={styles.timelineDate}>{formatDateTime(entry.changedAt)}</time>
              {entry.note && (
                <p className={styles.timelineNote}>{entry.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Modal de detalle ───────────────────────────────────────────── */
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { updateOrderStatus, updateOrder, deleteOrder, markAsPaid } = useAdminOrders();
  const { can } = useAdminAuth();
  const [notes, setNotes] = useState(order.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(order.status);

  const paymentStatus: PaymentStatus = order.paymentStatus ?? 'no-abonado';
  const isAbonado = paymentStatus === 'abonado';

  const hasStatusChange = pendingStatus !== order.status;

  const auth = useAdminAuth ? useAdminAuth() : null;
  const userEmail = (auth && (auth.user as any)?.email) || 'desconocido';
  const handleStatusApply = async () => {
    try {
      await updateOrderStatus(order.id, pendingStatus, statusNote.trim() || undefined);
      logAdminActivity({
        timestamp: new Date().toISOString(),
        user: userEmail,
        action: 'update-status',
        entity: 'order',
        entityId: order.id,
        details: { from: order.status, to: pendingStatus, note: statusNote },
      });
      toast.success('Estado del pedido actualizado con éxito');
      setStatusNote('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudo actualizar el pedido: ${message}`);
    }
  };

  // Sync local pendingStatus if order.status changes externally
  const currentStatus = order.status;

  const handleSaveNotes = async () => {
    try {
      await updateOrder(order.id, { notes });
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
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudo eliminar el pedido: ${message}`);
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      await markAsPaid(orderId);
      toast.success('Pedido marcado como abonado');
    } catch (err) {
      toast.error('Error al marcar como abonado');
    }
  };

  const initials = `${order.customer.firstName[0] ?? ''}${order.customer.lastName[0] ?? ''}`;

  return (
    <div
      className={styles.backdrop}
      onClick={e => e.target === e.currentTarget && onClose()}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Escape' || e.key === 'Enter') && onClose()}
    >
      <div className={styles.detailPanel} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderInfo}>
            <h2 className={styles.detailTitle}>Pedido #{order.id.slice(0, 8).toUpperCase()}</h2>
            <span className={styles.detailDate}>{formatDateTime(order.createdAt)}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Cerrar">✕</button>
        </div>

        <div className={styles.detailBody}>
          {/* Estado */}
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Estado del pedido</h3>
            <div className={styles.statusRow}>
              <span className={`${styles.statusBadge} ${statusClass(currentStatus, styles)}`}>
                {STATUS_LABELS[currentStatus]}
              </span>
              {can('orders.edit') && (
                <select
                  className={styles.statusSelect}
                  value={pendingStatus}
                  onChange={e => setPendingStatus(e.target.value as OrderStatus)}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              )}
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
                />
                <div className={styles.statusChangeActions}>
                  <button className={styles.applyStatusBtn} type="button" onClick={handleStatusApply}>
                    Guardar cambio
                  </button>
                  <button className={styles.cancelBtn} type="button" onClick={() => { setPendingStatus(currentStatus); setStatusNote(''); }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Historial de estados */}
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Historial de estados</h3>
            <OrderTimeline history={order.statusHistory ?? []} currentStatus={order.status} />
          </section>

          {/* Pago / Confirmación WhatsApp */}
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

          {/* Datos del cliente */}
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

          {/* Productos */}
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

          {/* Notas */}
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
              <button className={styles.saveNotesBtn} type="button" onClick={handleSaveNotes}>
                Guardar notas
              </button>
            </section>
          )}

          {/* Zona peligrosa */}
          {can('orders.delete') && (
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Zona peligrosa</h3>
              <div className={styles.dangerSection}>
                {!confirmDelete ? (
                  <Tooltip content="Eliminar este pedido. Esta acción no se puede deshacer.">
                    <button className={styles.deleteBtn} type="button" onClick={() => setConfirmDelete(true)} aria-label="Eliminar pedido">
                      🗑️ Eliminar este pedido
                    </button>
                  </Tooltip>
                ) : (
                  <div className={styles.confirmDelete}>
                    <span>¿Seguro que querés eliminar este pedido? Esta acción no se puede deshacer.</span>
                    <div className={styles.confirmActions}>
                      <button className={styles.deleteConfirmBtn} type="button" onClick={handleDelete}>Sí, eliminar</button>
                      <button className={styles.cancelBtn} type="button" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
  const { token } = useAdminAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // Estado para modales globales
  const [modal, setModal] = useState<{
    open: boolean;
    type: 'delete' | 'status' | 'paid' | null;
    order: Order | null;
    payload?: Record<string, unknown>;
    isLoading?: boolean;
    message?: string;
  }>({ open: false, type: null, order: null });

  const handleCloseModal = useCallback(() => {
    setModal({ open: false, type: null, order: null });
  }, []);
  const handleConfirmModal = useCallback(async () => {
    setModal(m => ({ ...m, isLoading: true }));
    setTimeout(() => {
      toast.success('Acción simulada');
      setModal({ open: false, type: null, order: null });
    }, 1000);
  }, []);

  // Filtros
  const filters = useOrdersFilters();
  // Pedidos y lógica
  const {
    orders, isLoading, isLoadingMore, hasMore, selectedIds,
    handleSelectOne, handleLoadMore, summary, totalAbonados
  } = useOrders(token ?? undefined, {
    search: filters.search,
    status: filters.filterStatus,
    dateFrom: filters.filterDateFrom,
    dateTo: filters.filterDateTo,
  });

  // Skeletons
  const SummarySkeleton = () => (
    <div className={styles.summaryCard}>
      <div className={styles.skeletonSummaryIcon}></div>
      <div className={styles.skeletonSummaryNum}></div>
      <div className={styles.skeletonSummaryLabel}></div>
    </div>
  );

  return (
    <div className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`}>
      {/* Header */}
      <OrdersHeader />

      {/* Resumen / Métricas rápidas */}
      <div className={styles.summary}>
        {isLoading ? (
          <>
            <SummarySkeleton />
            <SummarySkeleton />
            <SummarySkeleton />
            <SummarySkeleton />
            <SummarySkeleton />
            <SummarySkeleton />
          </>
        ) : (
          <>
            <div className={`${styles.summaryCard} ${styles.cardTotal}`}>
              <span className={styles.summaryIcon}>🛒</span>
              <span className={styles.summaryNum}>{orders.length}</span>
              <span className={styles.summaryLabel}>Total pedidos</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardPendiente}`}>
              <span className={styles.summaryIcon}>⏳</span>
              <span className={`${styles.summaryNum} ${styles.numPendiente}`}>{summary.pendiente}</span>
              <span className={styles.summaryLabel}>Pendientes</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardPreparacion}`}>
              <span className={styles.summaryIcon}>🔧</span>
              <span className={`${styles.summaryNum} ${styles.numPreparacion}`}>{summary['en-preparacion']}</span>
              <span className={styles.summaryLabel}>En preparación</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardEnviado}`}>
              <span className={styles.summaryIcon}>🚚</span>
              <span className={`${styles.summaryNum} ${styles.numEnviado}`}>{summary.enviado}</span>
              <span className={styles.summaryLabel}>Enviados</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardEntregado}`}>
              <span className={styles.summaryIcon}>✅</span>
              <span className={`${styles.summaryNum} ${styles.numEntregado}`}>{summary.entregado}</span>
              <span className={styles.summaryLabel}>Entregados</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardAbonado}`}>
              <span className={styles.summaryIcon}>💬</span>
              <span className={`${styles.summaryNum} ${styles.numAbonado}`}>{totalAbonados}</span>
              <span className={styles.summaryLabel}>Abonados</span>
            </div>
          </>
        )}
      </div>

      {/* Filtros */}
      <OrdersFilters
        search={filters.search}
        setSearch={filters.setSearch}
        filterStatus={filters.filterStatus}
        setFilterStatus={filters.setFilterStatus}
        filterDateFrom={filters.filterDateFrom}
        setFilterDateFrom={filters.setFilterDateFrom}
        filterDateTo={filters.filterDateTo}
        setFilterDateTo={filters.setFilterDateTo}
        clearFilters={filters.clearFilters}
        isLoading={isLoading}
      />

      {!isLoading && (
        <p className={styles.resultsCount}>
          {orders.length} pedido{orders.length !== 1 ? 's' : ''}
        </p>
      )}



      {/* Carga progresiva: botón cargar más */}
      <div className={styles.paginationWrap}>
        {hasMore && !isLoading && (
          <button
            className={styles.paginationBtn}
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Cargando...' : 'Cargar más'}
          </button>
        )}
        {!hasMore && !isLoading && orders.length > 0 && (
          <span className={styles.paginationEnd}>No hay más pedidos para mostrar.</span>
        )}
      </div>




      {/* Lista de pedidos */}
      {isLoading ? (
        <>
          <SummarySkeleton />
          {/* Aquí puedes agregar skeletons para tabla y mobile si lo deseas */}
        </>
      ) : orders.length === 0 ? (
        <div className={sectionStyles.emptyState}>
          <span className={sectionStyles.emptyIcon}>🛒</span>
          <p className={sectionStyles.emptyText}>No se encontraron pedidos con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          <OrdersTable
            orders={orders}
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onDetail={setSelectedOrder}
          />
          <OrderList
            orders={orders}
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onDetail={setSelectedOrder}
          />
          {/* Acciones masivas y modals pueden ir aquí */}
          <div style={{ height: '100px'}} aria-hidden='true'/>
        </>
      )}

      {/* Modal detalle */}
      {selectedOrder && (
        <OrderDetailModal
          order={(orders.find(o => o.id === selectedOrder!.id) ?? selectedOrder!)}
          onClose={() => setSelectedOrder(null)}
        />
      )}


      {/* ModalConfirm global */}
      <ModalConfirm
        open={modal.open}
        title={
          modal.type === 'delete' ? 'Eliminar pedido' :
            modal.type === 'status' ? 'Actualizar estado' :
              modal.type === 'paid' ? 'Confirmar pago' :
                'Confirmar acción'
        }
        message={
          modal.type === 'delete'
            ? '¿Seguro que deseas eliminar este pedido? Esta acción no se puede deshacer.'
            : modal.type === 'status' && !!modal.payload && typeof modal.payload.status === 'string'
              ? `¿Confirmar cambio de estado a "${STATUS_LABELS[(modal.payload as { status: string }).status as OrderStatus]}"?`
              : modal.type === 'paid'
                ? '¿Confirmar que el cliente abonó este pedido?'
                : ''
        }
        confirmText={modal.isLoading ? 'Procesando...' : 'Confirmar'}
        cancelText={'Cancelar'}
        onConfirm={modal.isLoading ? () => { } : handleConfirmModal}
        onCancel={modal.isLoading ? () => { } : handleCloseModal}
      />

    </div>
  );
}

export default AdminOrders;
