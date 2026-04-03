import { Tooltip } from '../../../components/ui/Tooltip/Tooltip';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

import toast from 'react-hot-toast';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useAdminOrders } from '../../../context/AdminOrdersContext';
import { fetchAdminOrders, mapApiOrderToOrder } from './ordersService';
import { logAdminActivity } from '../../../services/adminActivityLogService';
import type { Order, OrderStatus, PaymentStatus, OrderHistoryEntry } from '../../../context/AdminOrdersContext';
// ...existing code...
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminOrders.module.css';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { Notification } from '../../../components/ui/Notification';
import { useReportsExport } from '../reports/hooks/useReportsExport';

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



export function AdminOrders() {
  const { token } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // const [isLoadingMore, setIsLoadingMore] = useState(false); // No se usa
  // const [hasMore, setHasMore] = useState(true); // No se usa
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  // const [total, setTotal] = useState(0); // Si se requiere mostrar total, descomentar

  // Filtros y búsqueda
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Debounce para búsqueda
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  // Resetear lista al cambiar filtros
  useEffect(() => {
    setPage(1);
    setOrders([]);
    // setHasMore(true);
  }, [debouncedSearch, filterStatus, filterDateFrom, filterDateTo]);

  // Fetch paginado
  const abortRef = useRef<AbortController | null>(null);
  const fetchOrders = useCallback(async (reset = false) => {
    if (!token) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (reset) setIsLoading(true);
    else setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: PAGE_SIZE,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (filterStatus) params.status = filterStatus;
      if (filterDateFrom) params.from = filterDateFrom;
      if (filterDateTo) params.to = filterDateTo;
      // API puede requerir otros nombres, ajustar si es necesario
      const res = await fetchAdminOrders(token, params);
      // setHasMore(res.data.length === PAGE_SIZE);
      const normalized = res.data.map(mapApiOrderToOrder);
      setOrders(prev => reset ? normalized : [...prev, ...normalized]);
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error('Error al cargar pedidos');
    } finally {
      setIsLoading(false);
      setIsLoading(false);
    }
  }, [token, page, PAGE_SIZE, debouncedSearch, filterStatus, filterDateFrom, filterDateTo]);

  // Cargar pedidos al montar y al cambiar filtros
  useEffect(() => {
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterStatus, filterDateFrom, filterDateTo, token]);

  // Cargar más
  // const handleLoadMore = useCallback(() => {
  //   setPage(p => p + 1);
  // }, []); // No se usa

  // Cargar más cuando cambia page
  useEffect(() => {
    if (page === 1) return;
    fetchOrders(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Helpers selección múltiple
  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const clearSelection = useCallback(() => setSelectedIds([]), []);

  // Resumen por estado
  const summary = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, s) => {
      acc[s] = orders.filter(o => o.status === s).length;
      return acc;
    }, {} as Record<OrderStatus, number>);
  }, [orders]);

  const totalAbonados = useMemo(() => orders.filter(o => o.paymentStatus === 'abonado').length, [orders]);

  // Skeletons
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


  // ModalConfirm global
  const [modal, setModal] = useState<{
    open: boolean;
    type: 'delete' | 'status' | 'paid' | null;
    order: Order | null;
    payload?: Record<string, unknown>;
    isLoading?: boolean;
    message?: string;
  }>({ open: false, type: null, order: null });

  // Acciones masivas
  type BulkAction = 'confirm' | 'ship' | 'cancel';
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ── Export ──────────────────────────────────────────────────────
  // Pasamos `orders` (ya filtrado por los filtros de UI) al hook
  const {
    notif, setNotif,
    exportLoading,
    showExportModal, setShowExportModal,
    exportFormat, setExportFormat,
    handleExport,
  } = useReportsExport(
    orders,
    // Construimos un objeto filters compatible con el hook
    filterDateFrom || filterDateTo
      ? { type: 'custom' }
      : { type: 'predefined', period: filterStatus || 'todos' }
  );

  // Validaciones de compatibilidad de acción
  const canBulkAction = useCallback((action: BulkAction, orders: Order[]): boolean => {
    if (action === 'confirm') return orders.every(o => o.status === 'pendiente');
    if (action === 'ship') return orders.every(o => o.status === 'confirmado' || o.status === 'en-preparacion');
    if (action === 'cancel') return orders.every(o => o.status !== 'enviado' && o.status !== 'entregado' && o.status !== 'cancelado');
    return false;
  }, []);
  const getBulkActionLabel = (action: BulkAction): string => {
    if (action === 'confirm') return 'Confirmar';
    if (action === 'ship') return 'Marcar como Enviado';
    if (action === 'cancel') return 'Cancelar';
    return '';
  };
  const handleBulkAction = useCallback((action: BulkAction) => {
    setBulkAction(action);
    setBulkModalOpen(true);
  }, []);
  const executeBulkAction = useCallback(async () => {
    if (!bulkAction) return;
    setBulkLoading(true);
    // Aquí deberías llamar a la acción real del contexto si está disponible
    // Por ahora, solo simula
    setTimeout(() => {
      toast.success('Acción masiva simulada');
      setBulkModalOpen(false);
      setBulkLoading(false);
      setBulkAction(null);
      clearSelection();
    }, 1000);
  }, [bulkAction, clearSelection]);

  // Modals críticos
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

  return (
    <main className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`} tabIndex={-1} aria-label="Gestión de pedidos">
      {/* Header */}
      <header className={sectionStyles.header}>
        <span className={sectionStyles.label}>Administración</span>
        <h1 className={sectionStyles.title}>
          <span className={sectionStyles.icon} aria-hidden="true">🛒</span> Pedidos
          <Tooltip content="Aquí podés ver y gestionar todos los pedidos realizados por los clientes. Usa los filtros y acciones para administrar el flujo de ventas.">
            <button
              type="button"
              aria-label="Ayuda sección pedidos"
              style={{ background: 'none', border: 'none', marginLeft: 8, cursor: 'pointer', color: '#2563eb', fontSize: 20 }}
              tabIndex={0}
            >
              ℹ️
            </button>
          </Tooltip>
        </h1>
        <p className={sectionStyles.subtitle}>
          Revisá, procesá y gestioná los pedidos de clientes.
        </p>
      </header>

      {/* Resumen / Métricas rápidas */}
      <section className={styles.summary} aria-label="Resumen de pedidos">
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
      </section>
      {/* Exportación */}
      <section className={styles.exportWrap} aria-label="Exportar pedidos">
        <div className={styles.exportControls}>
          <span className={styles.exportLabel}>Exportar como:</span>
          <div className={styles.exportSelectWrap}>
            <select
              className={styles.exportSelect}
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value as 'csv' | 'xlsx' | 'pdf')}
              disabled={exportLoading !== null}
              aria-label="Formato de exportación"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              type="button"
              className={styles.exportBtn}
              onClick={() => {
                if (!orders.length) {
                  setNotif({ open: true, type: 'error', message: 'No hay pedidos para exportar.' });
                  return;
                }
                setShowExportModal(true);
              }}
              disabled={exportLoading !== null || orders.length === 0}
              aria-label={`Exportar pedidos como ${exportFormat.toUpperCase()}`}
              title={orders.length === 0 ? 'No hay pedidos para exportar' : `Exportar ${orders.length} pedidos como ${exportFormat.toUpperCase()}`}
            >
              {exportLoading ? '⏳ Exportando…' : '⬇ Exportar'}
            </button>
          </div>
        </div>

        <ModalConfirm
          open={showExportModal}
          title="Exportar pedidos"
          message={`¿Exportar ${orders.length} pedido${orders.length !== 1 ? 's' : ''} como ${exportFormat.toUpperCase()}?`}
          confirmText={exportLoading ? 'Exportando…' : 'Exportar'}
          cancelText="Cancelar"
          onConfirm={handleExport}
          onCancel={() => setShowExportModal(false)}
        />

        <Notification
          open={notif.open}
          type={notif.type}
          message={notif.message}
          onClose={() => setNotif(n => ({ ...n, open: false }))}
        />
      </section>

      {/* Filtros */}
      <section className={styles.filters} aria-label="Filtros de pedidos">
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por cliente, email o N° de pedido..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            disabled={isLoading}
            aria-label="Buscar pedidos"
          />
          <Tooltip content="Buscá pedidos por nombre, email o número de pedido.">
            <button
              type="button"
              aria-label="Ayuda búsqueda"
              style={{ background: 'none', border: 'none', marginLeft: 4, cursor: 'pointer', color: '#2563eb', fontSize: 18 }}
              tabIndex={0}
            >
              ℹ️
            </button>
          </Tooltip>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as OrderStatus | '')}
            disabled={isLoading}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <Tooltip content="Filtrá los pedidos por estado (pendiente, confirmado, etc).">
            <button
              type="button"
              aria-label="Ayuda filtro estado"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 18 }}
              tabIndex={0}
            >
              ℹ️
            </button>
          </Tooltip>
        </div>
        <div className={styles.dateFilters} style={{ alignItems: 'center', gap: 4 }}>
          <label className={styles.dateLabel} htmlFor="order-date-from">Desde</label>
          <input
            className={styles.dateInput}
            id="order-date-from"
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            disabled={isLoading}
            aria-label="Filtrar desde fecha"
          />
          <label className={styles.dateLabel} htmlFor="order-date-to">Hasta</label>
          <input
            className={styles.dateInput}
            id="order-date-to"
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            disabled={isLoading}
            aria-label="Filtrar hasta fecha"
          />
          <Tooltip content="Filtrá los pedidos por rango de fechas.">
            <button
              type="button"
              aria-label="Ayuda filtro fechas"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 18 }}
              tabIndex={0}
            >
              ℹ️
            </button>
          </Tooltip>
        </div>
        {!isLoading && (search || filterStatus || filterDateFrom || filterDateTo) && (
          <button
            className={styles.clearBtn}
            type="button"
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            aria-label="Limpiar filtros"
          >
            ✕ Limpiar
          </button>
        )}
      </section>

      {
        !isLoading && (
          <p className={styles.resultsCount} id="orders-count" aria-live="polite">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''}
          </p>
        )
      }



      {/* Controles de paginación */}
      {/* Paginación simple basada en page y PAGE_SIZE */}
      <nav className={styles.paginationWrap} aria-label="Paginación de pedidos">
        <button
          className={styles.paginationBtn}
          type="button"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Anterior
        </button>
        <div className={styles.paginationPages}>
          {Array.from({ length: Math.ceil(orders.length / PAGE_SIZE) || 1 }).map((_, i) => (
            <button
              key={i + 1}
              className={
                page === i + 1
                  ? `${styles.paginationPage} ${styles.paginationPageActive}`
                  : styles.paginationPage
              }
              type="button"
              onClick={() => setPage(i + 1)}
              aria-current={page === i + 1 ? 'page' : undefined}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          className={styles.paginationBtn}
          type="button"
          onClick={() => setPage(p => Math.min(Math.ceil(orders.length / PAGE_SIZE) || 1, p + 1))}
          disabled={page === (Math.ceil(orders.length / PAGE_SIZE) || 1)}
        >
          Siguiente →
        </button>
      </nav>




      {/* Lista de pedidos */}
      {
        isLoading ? (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table} aria-label="Pedidos" aria-describedby="orders-count">
                <caption className="sr-only">Lista de pedidos de clientes</caption>
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">N° Pedido</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Productos</th>
                    <th scope="col">Total</th>
                    <th scope="col">Estado</th>
                    <th scope="col"></th>
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
        ) : orders.length === 0 ? (
          <div className={sectionStyles.emptyState}>
            <span className={sectionStyles.emptyIcon}>🛒</span>
            <p className={sectionStyles.emptyText}>No se encontraron pedidos con los filtros aplicados.</p>
          </div>
        ) : (
          <>
            {/* Tabla — tablet y desktop */}
            <div className={styles.tableWrapper}>
              <table className={styles.table} aria-label="Pedidos" aria-describedby="orders-count">
                <caption className="sr-only">Lista de pedidos de clientes</caption>
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">N° Pedido</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Productos</th>
                    <th scope="col">Total</th>
                    <th scope="col">Estado</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr
                      key={order.id}
                      className={styles.row}
                      onClick={() => setSelectedOrder(order)}
                      tabIndex={0}
                      aria-label={`Ver detalle del pedido #${order.id.slice(0, 8).toUpperCase()}`}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedOrder(order)}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={e => { e.stopPropagation(); handleSelectOne(order.id); }}
                          aria-label={`Seleccionar pedido ${order.id}`}
                          onClick={e => e.stopPropagation()}
                          tabIndex={0}
                        />
                      </td>
                      <td className={styles.orderId}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className={styles.orderDate}>{formatDate(order.createdAt)}</td>
                      <td>
                        <div className={styles.customerName}>{order.customer.firstName} {order.customer.lastName}</div>
                        <div className={styles.customerEmail}>{order.customer.email}</div>
                      </td>
                      <td className={styles.itemCount}>
                        {order.items.reduce((s, i) => s + i.quantity, 0)} ítem{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
                      </td>
                      <td className={styles.orderTotal}>
                        {formatPrice(order.total)}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${statusClass(order.status)}`}
                          aria-label={`Estado: ${STATUS_LABELS[order.status]}`}
                          role="status"
                          aria-live="polite"
                          tabIndex={0}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                        {order.paymentStatus === 'abonado' && (
                          <span
                            className={styles.paymentBadge}
                            aria-label="Pago abonado"
                            tabIndex={0}
                          >
                            ✓ Abonado
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className={styles.detailBtn}
                          type="button"
                          onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}
                          aria-label={`Ver detalle del pedido #${order.id.slice(0, 8).toUpperCase()}`}
                          title="Ver detalle"
                          tabIndex={0}
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
              {orders.map(order => {
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
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order.id)}
                        onChange={e => { e.stopPropagation(); handleSelectOne(order.id); }}
                        aria-label={`Seleccionar pedido ${order.id}`}
                        onClick={e => e.stopPropagation()}
                        style={{ marginRight: 8, minWidth: 24, minHeight: 24 }}
                      />
                      <span className={styles.mobileCardId}>
                        #{order.id.slice(0, 8).toUpperCase()}
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
                      <span className={styles.statusBadge + ' ' + statusClass(order.status)}>{STATUS_LABELS[order.status]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Acciones masivas */}
            {selectedIds.length > 0 && (
              <div
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  display: 'flex',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  padding: '0 0 8px 0',
                }}
              >
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                    padding: 12,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    pointerEvents: 'auto',
                    maxWidth: 480,
                    width: '100%',
                    margin: '0 8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 15, flex: '1 1 100%' }}>{selectedIds.length} seleccionados</span>
                  <Tooltip content="Confirmar todos los pedidos seleccionados">
                    <button
                      type="button"
                      disabled={!canBulkAction('confirm', orders.filter(o => selectedIds.includes(o.id)))}
                      onClick={() => handleBulkAction('confirm')}
                      style={{
                        padding: '8px 0',
                        borderRadius: 8,
                        border: 'none',
                        background: '#2563eb',
                        color: '#fff',
                        fontWeight: 500,
                        cursor: 'pointer',
                        flex: '1 1 120px',
                        fontSize: 15,
                      }}
                      aria-label="Confirmar pedidos seleccionados"
                    >Confirmar</button>
                  </Tooltip>
                  <Tooltip content="Marcar como enviados los pedidos seleccionados">
                    <button
                      type="button"
                      disabled={!canBulkAction('ship', orders.filter(o => selectedIds.includes(o.id)))}
                      onClick={() => handleBulkAction('ship')}
                      style={{
                        padding: '8px 0',
                        borderRadius: 8,
                        border: 'none',
                        background: '#10b981',
                        color: '#fff',
                        fontWeight: 500,
                        cursor: 'pointer',
                        flex: '1 1 120px',
                        fontSize: 15,
                      }}
                      aria-label="Marcar como enviados"
                    >Enviado</button>
                  </Tooltip>
                  <Tooltip content="Cancelar todos los pedidos seleccionados">
                    <button
                      type="button"
                      disabled={!canBulkAction('cancel', orders.filter(o => selectedIds.includes(o.id)))}
                      onClick={() => handleBulkAction('cancel')}
                      style={{
                        padding: '8px 0',
                        borderRadius: 8,
                        border: 'none',
                        background: '#ef4444',
                        color: '#fff',
                        fontWeight: 500,
                        cursor: 'pointer',
                        flex: '1 1 120px',
                        fontSize: 15,
                      }}
                      aria-label="Cancelar pedidos seleccionados"
                    >Cancelar</button>
                  </Tooltip>
                  <button
                    type="button"
                    onClick={clearSelection}
                    style={{
                      marginLeft: 0,
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      flex: '1 1 100%',
                      fontSize: 14,
                      padding: '6px 0 0 0',
                    }}
                  >Limpiar</button>
                </div>
              </div>
            )}

            {/* Modal de confirmación de acción masiva */}
            {bulkModalOpen && bulkAction && (
              <ModalConfirm
                open={bulkModalOpen}
                title={`Acción masiva: ${getBulkActionLabel(bulkAction)}`}
                message={`¿Seguro que deseas aplicar "${getBulkActionLabel(bulkAction)}" a los ${selectedIds.length} pedidos seleccionados? Esta acción no se puede deshacer.`}
                confirmText={bulkLoading ? 'Procesando...' : 'Confirmar'}
                cancelText={'Cancelar'}
                onConfirm={bulkLoading ? () => { } : executeBulkAction}
                onCancel={bulkLoading ? () => { } : () => setBulkModalOpen(false)}
              />
            )}
            <div style={{ height: '100px' }} aria-hidden='true' />
          </>
        )
      }

      {/* Modal detalle */}
      {
        selectedOrder && (
          <OrderDetailModal
            order={orders.find(o => o.id === selectedOrder.id) ?? selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )
      }

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
          modal.type === 'delete' ? '¿Seguro que deseas eliminar este pedido? Esta acción no se puede deshacer.' :
            modal.type === 'status' && typeof modal.payload?.status === 'string' ? `¿Confirmar cambio de estado a "${STATUS_LABELS[modal.payload.status as OrderStatus]}"?` :
              modal.type === 'paid' ? '¿Confirmar que el cliente abonó este pedido?' :
                ''
        }
        confirmText={modal.isLoading ? 'Procesando...' : 'Confirmar'}
        cancelText={'Cancelar'}
        onConfirm={modal.isLoading ? () => { } : handleConfirmModal}
        onCancel={modal.isLoading ? () => { } : handleCloseModal}
      />
    </main >
  );
}