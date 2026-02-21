import { useState, useMemo } from 'react';
import { useAdminOrders } from '../../../context/AdminOrdersContext';
import type { Order, OrderStatus, PaymentStatus, OrderHistoryEntry } from '../../../context/AdminOrdersContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import sectionStyles from './AdminSection.module.css';
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

  const handleStatusApply = () => {
    updateOrderStatus(order.id, pendingStatus, statusNote.trim() || undefined);
    setStatusNote('');
  };

  // Sync local pendingStatus if order.status changes externally
  const currentStatus = order.status;

  const handleSaveNotes = () => {
    updateOrder(order.id, { notes });
  };

  const handleDelete = () => {
    deleteOrder(order.id);
    onClose();
  };

  const initials = `${order.customer.firstName[0] ?? ''}${order.customer.lastName[0] ?? ''}`;

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
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
              <select
                className={styles.statusSelect}
                value={pendingStatus}
                onChange={e => setPendingStatus(e.target.value as OrderStatus)}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            {hasStatusChange && (
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

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  // Resumen por estado
  const summary = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, s) => {
      acc[s] = orders.filter(o => o.status === s).length;
      return acc;
    }, {} as Record<OrderStatus, number>);
  }, [orders]);

  const totalAbonados = useMemo(() => orders.filter(o => o.paymentStatus === 'abonado').length, [orders]);

  return (
    <div className={sectionStyles.page}>
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
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as OrderStatus | '')}
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <div className={styles.dateFilters}>
          <label className={styles.dateLabel}>Desde</label>
          <input
            className={styles.dateInput}
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
          />
          <label className={styles.dateLabel}>Hasta</label>
          <input
            className={styles.dateInput}
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
          />
        </div>
        {(search || filterStatus || filterDateFrom || filterDateTo) && (
          <button
            className={styles.clearBtn}
            type="button"
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      <p className={styles.resultsCount}>
        {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== orders.length ? ` (de ${orders.length})` : ''}
      </p>

      {/* Lista de pedidos */}
      {filtered.length === 0 ? (
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
                {filtered.map(order => (
                  <tr key={order.id} className={styles.row} onClick={() => setSelectedOrder(order)}>
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
            {filtered.map(order => {
              const initials = `${order.customer.firstName[0] ?? ''}${order.customer.lastName[0] ?? ''}`;
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div key={order.id} className={styles.mobileCard} onClick={() => setSelectedOrder(order)}>
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
