import React, { useState, useMemo } from 'react';



import toast from 'react-hot-toast';
import { useAdminOrders } from '../../../context/AdminOrdersContext';
import { logAdminActivity } from '../../../services/adminActivityLogService';
import type { Order, OrderStatus, PaymentStatus, OrderHistoryEntry } from '../../../context/AdminOrdersContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminOrders.module.css';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';

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


// ================= MOCK DATA PARA DEMO ===================
// Quitar este bloque cuando la API esté lista
const MOCK_ORDERS: Order[] = [
  {
    id: 'a1b2c3d4e5',
    createdAt: '2026-03-28T10:15:00Z',
    status: 'pendiente',
    paymentStatus: 'no-abonado',
    notes: '',
    customer: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
    },
    items: [
      { productId: 'p1', productName: 'Camiseta Allmart', quantity: 2, unitPrice: 3500 },
      { productId: 'p2', productName: 'Gorra', quantity: 1, unitPrice: 1800 },
    ],
    total: 8800,
    statusHistory: [
      { status: 'pendiente', changedAt: '2026-03-28T10:15:00Z', note: '' },
    ],
  },
  {
    id: 'f6g7h8i9j0',
    createdAt: '2026-03-27T14:30:00Z',
    status: 'confirmado',
    paymentStatus: 'abonado',
    notes: 'Cliente pidió entrega rápida',
    customer: {
      firstName: 'María',
      lastName: 'Gómez',
      email: 'maria.gomez@email.com',
    },
    items: [
      { productId: 'p3', productName: 'Remera', quantity: 1, unitPrice: 4200 },
      { productId: 'p4', productName: 'Pantalón', quantity: 1, unitPrice: 6900 },
    ],
    total: 11100,
    statusHistory: [
      { status: 'pendiente', changedAt: '2026-03-27T14:30:00Z', note: '' },
      { status: 'confirmado', changedAt: '2026-03-27T15:00:00Z', note: '' },
    ],
  },
  {
    id: 'k1l2m3n4o5',
    createdAt: '2026-03-25T09:00:00Z',
    status: 'enviado',
    paymentStatus: 'abonado',
    notes: '',
    customer: {
      firstName: 'Carlos',
      lastName: 'López',
      email: 'carlos.lopez@email.com',
    },
    items: [
      { productId: 'p5', productName: 'Zapatillas', quantity: 1, unitPrice: 15000 },
    ],
    total: 15000,
    statusHistory: [
      { status: 'pendiente', changedAt: '2026-03-25T09:00:00Z', note: '' },
      { status: 'confirmado', changedAt: '2026-03-25T09:30:00Z', note: '' },
      { status: 'en-preparacion', changedAt: '2026-03-25T10:00:00Z', note: '' },
      { status: 'enviado', changedAt: '2026-03-25T12:00:00Z', note: '' },
    ],
  },
  {
    id: 'p6q7r8s9t0',
    createdAt: '2026-03-20T16:45:00Z',
    status: 'entregado',
    paymentStatus: 'abonado',
    notes: '',
    customer: {
      firstName: 'Lucía',
      lastName: 'Martínez',
      email: 'lucia.martinez@email.com',
    },
    items: [
      { productId: 'p6', productName: 'Bolso', quantity: 1, unitPrice: 8000 },
      { productId: 'p7', productName: 'Llavero', quantity: 3, unitPrice: 500 },
    ],
    total: 9500,
    statusHistory: [
      { status: 'pendiente', changedAt: '2026-03-20T16:45:00Z', note: '' },
      { status: 'confirmado', changedAt: '2026-03-20T17:00:00Z', note: '' },
      { status: 'en-preparacion', changedAt: '2026-03-20T17:30:00Z', note: '' },
      { status: 'enviado', changedAt: '2026-03-20T18:00:00Z', note: '' },
      { status: 'entregado', changedAt: '2026-03-21T10:00:00Z', note: '' },
    ],
  },
  {
    id: 'u1v2w3x4y5',
    createdAt: '2026-03-18T11:20:00Z',
    status: 'cancelado',
    paymentStatus: 'no-abonado',
    notes: 'Cliente canceló antes de envío',
    customer: {
      firstName: 'Ana',
      lastName: 'Ruiz',
      email: 'ana.ruiz@email.com',
    },
    items: [
      { productId: 'p8', productName: 'Mochila', quantity: 1, unitPrice: 12000 },
    ],
    total: 12000,
    statusHistory: [
      { status: 'pendiente', changedAt: '2026-03-18T11:20:00Z', note: '' },
      { status: 'cancelado', changedAt: '2026-03-18T12:00:00Z', note: 'Cancelado por el cliente' },
    ],
  },
];
// ================= FIN MOCK DATA =========================

export function AdminOrders() {
  // const { orders, isLoading, bulkUpdateOrderStatus, updateOrderStatus, deleteOrder, markAsPaid } = useAdminOrders();

  // Para demo, usar datos mockeados:
  const orders = MOCK_ORDERS;
  const isLoading = false;
  // Las siguientes funciones pueden dejarse como mocks vacíos o comentarios si se usan en la UI
  // Se aceptan argumentos para evitar errores de cantidad de argumentos
  const bulkUpdateOrderStatus = (..._args: any[]) => Promise.resolve({ success: 0, failed: 0 });
  const updateOrderStatus = (..._args: any[]) => Promise.resolve();
  const deleteOrder = (..._args: any[]) => Promise.resolve();
  const markAsPaid = (..._args: any[]) => Promise.resolve();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // Estado para selección múltiple
  const [selectedIds, setSelectedIds] = useState<string[]>([]);


  // Helpers para selección múltiple (debe ir después de paginatedOrders)
  // --- MOVER ESTO DESPUÉS DE LA DECLARACIÓN DE paginatedOrders ---

  // Acciones masivas
  type BulkAction = 'confirm' | 'ship' | 'cancel';
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Validaciones de compatibilidad de acción
  function canBulkAction(action: BulkAction, orders: Order[]): boolean {
    if (action === 'confirm') return orders.every(o => o.status === 'pendiente');
    if (action === 'ship') return orders.every(o => o.status === 'confirmado' || o.status === 'en-preparacion');
    if (action === 'cancel') return orders.every(o => o.status !== 'enviado' && o.status !== 'entregado' && o.status !== 'cancelado');
    return false;
  }
  function getBulkActionLabel(action: BulkAction): string {
    if (action === 'confirm') return 'Confirmar';
    if (action === 'ship') return 'Marcar como Enviado';
    if (action === 'cancel') return 'Cancelar';
    return '';
  }

  const handleBulkAction = (action: BulkAction) => {
    setBulkAction(action);
    setBulkModalOpen(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction) return;
    setBulkLoading(true);
    const ordersToUpdate = orders.filter(o => selectedIds.includes(o.id));
    const valid = canBulkAction(bulkAction, ordersToUpdate);
    if (!valid) {
      toast.error('Algunos pedidos seleccionados no permiten esta acción.');
      setBulkLoading(false);
      setBulkModalOpen(false);
      return;
    }
    try {
      const result = await bulkUpdateOrderStatus({
        orderIds: selectedIds,
        action: bulkAction,
      });
      toast.success(`Acción masiva: ${result.success} pedidos actualizados${result.failed ? `, ${result.failed} fallidos` : ''}`);
      setBulkModalOpen(false);
      clearSelection();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo ejecutar la acción masiva';
      toast.error(message);
    } finally {
      setBulkLoading(false);
    }
  };

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

  // Helpers para selección múltiple (debe ir después de paginatedOrders)
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const clearSelection = () => setSelectedIds([]);

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

  // Estado para ModalConfirm
  const [modal, setModal] = useState<{
    open: boolean;
    type: 'delete' | 'status' | 'paid' | null;
    order: Order | null;
    payload?: Record<string, unknown>;
    isLoading?: boolean;
    message?: string;
  }>({ open: false, type: null, order: null });

  const { user } = useAdminAuth();

  // Controladores de acciones críticas

  const handleCloseModal = () => {
    setModal({ open: false, type: null, order: null });
  };

  const handleConfirmModal = async () => {
    if (!modal.order) return;
    setModal(m => ({ ...m, isLoading: true }));
    try {
      if (modal.type === 'delete') {
        await deleteOrder(modal.order.id);
        logAdminActivity({
          timestamp: new Date().toISOString(),
          user: user || 'desconocido',
          action: 'delete',
          entity: 'order',
          entityId: modal.order.id,
        });
        toast.success('Pedido eliminado con éxito');
        setSelectedOrder(null);
      } else if (modal.type === 'status') {
        const { status, note } = modal.payload || {};
        await updateOrderStatus(modal.order.id, status as OrderStatus, note as string | undefined);
        logAdminActivity({
          timestamp: new Date().toISOString(),
          user: user || 'desconocido',
          action: 'update-status',
          entity: 'order',
          entityId: modal.order.id,
          details: { from: modal.order.status, to: status, note },
        });
        toast.success('Estado del pedido actualizado con éxito');
      } else if (modal.type === 'paid') {
        await markAsPaid(modal.order.id);
        logAdminActivity({
          timestamp: new Date().toISOString(),
          user: user || 'desconocido',
          action: 'mark-paid',
          entity: 'order',
          entityId: modal.order.id,
        });
        toast.success('Pedido marcado como abonado');
      }
      handleCloseModal();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al procesar la acción';
      toast.error(errorMsg);
      setModal(m => ({ ...m, isLoading: false }));
    }
  };

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
                {paginatedOrders.map(order => (
                  <tr
                    key={order.id}
                    className={styles.row}
                    style={{
                      cursor: 'pointer',
                      background: '#fff',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => setSelectedOrder(order)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedOrder(order)}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.06)')}
                    onMouseOut={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <td style={{padding: '16px 12px'}}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order.id)}
                        onChange={e => { e.stopPropagation(); handleSelectOne(order.id); }}
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
                      {order.items.reduce((s, i) => s + i.quantity, 0)} ítem{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
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
                      <button
                        className={styles.detailBtn}
                        type="button"
                        onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}
                        title="Ver detalle"
                        style={{background: '#f3f4f6', color: '#2563eb', borderRadius: 8, fontWeight: 600, fontSize: 14, padding: '7px 16px', border: 'none', transition: 'background 0.15s'}}
                        onMouseOver={e => (e.currentTarget.style.background = '#e0e7ef')}
                        onMouseOut={e => (e.currentTarget.style.background = '#f3f4f6')}
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
                  style={{boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 14, marginBottom: 16, background: '#fff'}}
                >
                  <div className={styles.mobileCardTop} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 0 16px'}}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(order.id)}
                      onChange={e => { e.stopPropagation(); handleSelectOne(order.id); }}
                      aria-label={`Seleccionar pedido ${order.id}`}
                      onClick={e => e.stopPropagation()}
                      style={{ marginRight: 8 }}
                    />
                    <span style={{fontWeight: 700, fontSize: 17, color: '#2563eb', letterSpacing: 0.5}}>
                      #{order.id.slice(0,8).toUpperCase()}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 'auto' }}>
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
                    </div>
                  </div>
                  <div className={styles.mobileCardMid} style={{padding: '0 16px'}}>
                    <div className={styles.mobileCardCustomer}>
                      <div className={styles.mobileCardAvatar} style={{background: '#f3f4f6', color: '#2563eb', fontWeight: 700, fontSize: 16}}>{initials}</div>
                      <div>
                        <div className={styles.mobileCardName} style={{fontWeight: 600, fontSize: 16, color: '#111827'}}>
                          {order.customer.firstName} {order.customer.lastName}
                        </div>
                        <div className={styles.mobileCardEmail} style={{color: '#64748b', fontSize: 14}}>{order.customer.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.mobileCardBottom} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px 14px 16px'}}>
                    <span className={styles.mobileCardDate} style={{color: '#64748b', fontSize: 14}}>{formatDate(order.createdAt)}</span>
                    <span className={styles.mobileCardItems} style={{color: '#334155', fontSize: 15}}>{totalQty} ítem{totalQty !== 1 ? 's' : ''}</span>
                    <span className={styles.mobileCardTotal} style={{fontWeight: 700, fontSize: 16, color: '#059669'}}>{formatPrice(order.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>

                {/* Acciones masivas */}
                {selectedIds.length > 0 && (
                  <div style={{
                    position: 'fixed', bottom: 32, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none'
                  }}>
                    <div style={{
                      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: 16, display: 'flex', gap: 16, alignItems: 'center', pointerEvents: 'auto'
                    }}>
                      <span style={{ fontWeight: 500 }}>{selectedIds.length} seleccionados</span>
                      <button
                        type="button"
                        disabled={!canBulkAction('confirm', orders.filter(o => selectedIds.includes(o.id)))}
                        onClick={() => handleBulkAction('confirm')}
                        style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 500, cursor: 'pointer' }}
                      >Confirmar</button>
                      <button
                        type="button"
                        disabled={!canBulkAction('ship', orders.filter(o => selectedIds.includes(o.id)))}
                        onClick={() => handleBulkAction('ship')}
                        style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontWeight: 500, cursor: 'pointer' }}
                      >Marcar como Enviado</button>
                      <button
                        type="button"
                        disabled={!canBulkAction('cancel', orders.filter(o => selectedIds.includes(o.id)))}
                        onClick={() => handleBulkAction('cancel')}
                        style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 500, cursor: 'pointer' }}
                      >Cancelar</button>
                      <button
                        type="button"
                        onClick={clearSelection}
                        style={{ marginLeft: 8, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
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
                    onConfirm={bulkLoading ? () => {} : executeBulkAction}
                    onCancel={bulkLoading ? () => {} : () => setBulkModalOpen(false)}
                  />
                )}
          <div style={{ height: '100px'}} aria-hidden='true'/>
        </>
      )}

      {/* Modal detalle */}
      {selectedOrder && (
        <OrderDetailModal
          order={orders.find(o => o.id === selectedOrder.id) ?? selectedOrder}
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
    </div>
  );
}