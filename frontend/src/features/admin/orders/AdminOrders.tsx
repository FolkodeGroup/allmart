import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAdminOrders } from '../../../context/AdminOrdersContext';
import { logAdminActivity } from '../../../services/adminActivityLogService';
import type { Order, OrderStatus, PaymentStatus, OrderHistoryEntry } from '../../../context/AdminOrdersContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminOrders.module.css';

/* ── Helpers ──────────────────────────────────────────────────── */
const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  'en-preparacion': 'En preparación',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  'no-abonado': 'Sin abonar',
  'abonado': 'Abonado',
};

function paymentClass(status: PaymentStatus): string {
  return status === 'abonado' ? styles.paymentAbonado : styles.paymentNoAbonado;
}

const STATUS_OPTIONS: OrderStatus[] = [
  'pendiente', 'confirmado', 'en-preparacion', 'enviado', 'entregado', 'cancelado',
];

function statusClass(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pendiente: styles.statusPendiente,
    confirmado: styles.statusConfirmado,
    'en-preparacion': styles.statusPreparacion,
    enviado: styles.statusEnviado,
    entregado: styles.statusEntregado,
    cancelado: styles.statusCancelado,
  };
  return map[status];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n);
}

/* ── Iconos por estado ── */
const STATUS_ICONS: Record<OrderStatus, string> = {
  pendiente: '⏳',
  confirmado: '✔️',
  'en-preparacion': '🔧',
  enviado: '🚚',
  entregado: '✅',
  cancelado: '❌',
};

/* ── Componente Timeline de estados ─────────────────────────────── */
function OrderTimeline({ history, currentStatus }: { history: OrderHistoryEntry[]; currentStatus: OrderStatus }) {
  if (history.length === 0) {
    return (
      <p className={styles.timelineEmpty}>No hay registros de cambios de estado aún.</p>
    );
  }

  // Mostrar del más reciente al más antiguo
  const sorted = [...history].reverse();

  return (
    <ol className={styles.timeline}>
      {sorted.map((entry, idx) => {
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
                <span className={`${styles.statusBadge} ${statusClass(entry.status)}`}>
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
  const handleStatusApply = () => {
    try {
      updateOrderStatus(order.id, pendingStatus, statusNote.trim() || undefined);
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

  const handleSaveNotes = () => {
    try {
      updateOrder(order.id, { notes });
      toast.success('Notas guardadas con éxito');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`No se pudieron guardar las notas: ${message}`);
    }
  };

  const handleDelete = () => {
    try {
      deleteOrder(order.id);
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
            <h2 className={styles.detailTitle}>Pedido #{order.id.slice(0,8).toUpperCase()}</h2>
            <span className={styles.detailDate}>{formatDateTime(order.createdAt)}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Cerrar">✕</button>
        </div>

        <div className={styles.detailBody}>
          {/* Estado */}
          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Estado del pedido</h3>
            <div className={styles.statusRow}>
              <span className={`${styles.statusBadge} ${statusClass(currentStatus)}`}>
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
                <span className={`${styles.paymentBadge} ${paymentClass(paymentStatus)}`}>
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
                          onClick={() => { markAsPaid(order.id); setConfirmPaid(false); }}
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
                  <button className={styles.deleteBtn} type="button" onClick={() => setConfirmDelete(true)}>
                    🗑️ Eliminar este pedido
                  </button>
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

/* ── Componente principal ───────────────────────────────────────── */
export function AdminOrders() {

  const { orders } = useAdminOrders();

  const [isLoading, _setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Paginación
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear página al cambiar filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterDateFrom, filterDateTo]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customer.firstName.toLowerCase().includes(q) ||
        o.customer.lastName.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q);

      const matchStatus = !filterStatus || o.status === filterStatus;

      const date = new Date(o.createdAt).getTime();
      const matchFrom = !filterDateFrom || date >= new Date(filterDateFrom).getTime();
      const matchTo = !filterDateTo || date <= new Date(filterDateTo + 'T23:59:59').getTime();

      return matchSearch && matchStatus && matchFrom && matchTo;
    });
  }, [orders, search, filterStatus, filterDateFrom, filterDateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Resumen por estado
  const summary = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, s) => {
      acc[s] = orders.filter(o => o.status === s).length;
      return acc;
    }, {} as Record<OrderStatus, number>);
  }, [orders]);

  const totalAbonados = useMemo(() => orders.filter(o => o.paymentStatus === 'abonado').length, [orders]);

  const SummarySkeleton = () => (
    <div className={styles.summaryCard}>
      <div className={styles.skeletonSummaryIcon}></div>
      <div className={styles.skeletonSummaryNum}></div>
      <div className={styles.skeletonSummaryLabel}></div>
    </div>
  );

  const TableRowSkeleton = () => (
    <tr className={styles.row}>
      <td className={styles.orderId}><div className={styles.skeletonOrderId}></div></td>
      <td className={styles.orderDate}><div className={styles.skeletonOrderDate}></div></td>
      <td>
        <div className={styles.skeletonCustomerName}></div>
        <div className={styles.skeletonCustomerEmail}></div>
      </td>
      <td className={styles.itemCount}><div className={styles.skeletonItemCount}></div></td>
      <td className={styles.orderTotal}><div className={styles.skeletonOrderTotal}></div></td>
      <td><div className={styles.skeletonStatusBadge}></div></td>
      <td><div className={styles.skeletonButton}></div></td>
    </tr>
  );

  const MobileCardSkeleton = () => (
    <div className={styles.mobileCard}>
      <div className={styles.mobileCardTop}>
        <div className={styles.skeletonMobileCardId}></div>
        <div className={styles.skeletonMobileBadge}></div>
      </div>
      <div className={styles.mobileCardMid}>
        <div className={styles.mobileCardCustomer}>
          <div className={styles.skeletonMobileAvatar}></div>
          <div>
            <div className={styles.skeletonMobileCardName}></div>
            <div className={styles.skeletonMobileCardEmail}></div>
          </div>
        </div>
      </div>
      <div className={styles.mobileCardBottom}>
        <div className={styles.skeletonMobileCardDate}></div>
        <div className={styles.skeletonMobileCardItems}></div>
        <div className={styles.skeletonMobileCardTotal}></div>
      </div>
    </div>
  );

  return (
    <div className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`}>
      {/* Header */}
      <div className={sectionStyles.header}>
        <span className={sectionStyles.label}>Administración</span>
        <h1 className={sectionStyles.title}>
          <span className={sectionStyles.icon}>🛒</span> Pedidos
        </h1>
        <p className={sectionStyles.subtitle}>
          Revisá, procesá y gestioná los pedidos de clientes.
        </p>
      </div>

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
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por cliente, email o N° de pedido..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as OrderStatus | '')}
          disabled={isLoading}
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <div className={styles.dateFilters}>
          <label className={styles.dateLabel} htmlFor="order-date-from">Desde</label>
          <input
            className={styles.dateInput}
            id="order-date-from"
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            disabled={isLoading}
          />
          <label className={styles.dateLabel} htmlFor="order-date-to">Hasta</label>
          <input
            className={styles.dateInput}
            id="order-date-to"
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {!isLoading && (search || filterStatus || filterDateFrom || filterDateTo) && (
          <button
            className={styles.clearBtn}
            type="button"
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {!isLoading && (
        <p className={styles.resultsCount}>
          {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== orders.length ? ` (de ${orders.length})` : ''}
        </p>
      )}



{/* Controles de paginación */}
          <div className={styles.paginationWrap}>
            <button
              className={styles.paginationBtn}
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>
            <div className={styles.paginationPages}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  className={
                    currentPage === i + 1
                      ? `${styles.paginationPage} ${styles.paginationPageActive}`
                      : styles.paginationPage
                  }
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  aria-current={currentPage === i + 1 ? 'page' : undefined}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              className={styles.paginationBtn}
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </button>
          </div>




      {/* Lista de pedidos */}
      {isLoading ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <MobileCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : filtered.length === 0 ? (
        <div className={sectionStyles.emptyState}>
          <span className={sectionStyles.emptyIcon}>🛒</span>
          <p className={sectionStyles.emptyText}>No se encontraron pedidos con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          {/* Tabla — tablet y desktop */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(order => (
                  <tr
                    key={order.id}
                    className={styles.row}
                    onClick={() => setSelectedOrder(order)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedOrder(order)}
                  >
                    <td className={styles.orderId}>#{order.id.slice(0,8).toUpperCase()}</td>
                    <td className={styles.orderDate}>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className={styles.customerName}>
                        {order.customer.firstName} {order.customer.lastName}
                      </div>
                      <div className={styles.customerEmail}>{order.customer.email}</div>
                    </td>
                    <td className={styles.itemCount}>
                      {order.items.reduce((s, i) => s + i.quantity, 0)} ítem{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
                    </td>
                    <td className={styles.orderTotal}>{formatPrice(order.total)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(order.status)}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.paymentStatus === 'abonado' && (
                        <span className={`${styles.paymentBadge} ${styles.paymentAbonado} ${styles.paymentBadgeInline}`}>
                          ✓ Abonado
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className={styles.detailBtn}
                        type="button"
                        onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}
                        title="Ver detalle"
                      >
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas — mobile */}
          <div className={styles.mobileList}>
            {paginatedOrders.map(order => {
              const initials = `${order.customer.firstName[0] ?? ''}${order.customer.lastName[0] ?? ''}`;
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={order.id}
                  className={styles.mobileCard}
                  onClick={() => setSelectedOrder(order)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedOrder(order)}
                >
                  <div className={styles.mobileCardTop}>
                    <span className={styles.mobileCardId}>#{order.id.slice(0,8).toUpperCase()}</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span className={`${styles.statusBadge} ${statusClass(order.status)}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.paymentStatus === 'abonado' && (
                        <span className={`${styles.paymentBadge} ${styles.paymentAbonado}`}>
                          ✓ Abonado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.mobileCardMid}>
                    <div className={styles.mobileCardCustomer}>
                      <div className={styles.mobileCardAvatar}>{initials}</div>
                      <div>
                        <div className={styles.mobileCardName}>
                          {order.customer.firstName} {order.customer.lastName}
                        </div>
                        <div className={styles.mobileCardEmail}>{order.customer.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.mobileCardBottom}>
                    <span className={styles.mobileCardDate}>{formatDate(order.createdAt)}</span>
                    <span className={styles.mobileCardItems}>{totalQty} ítem{totalQty !== 1 ? 's' : ''}</span>
                    <span className={styles.mobileCardTotal}>{formatPrice(order.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal detalle */}
      {selectedOrder && (
        <OrderDetailModal
          order={orders.find(o => o.id === selectedOrder.id) ?? selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
