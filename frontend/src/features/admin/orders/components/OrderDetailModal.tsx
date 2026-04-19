// ─────────────────────────────────────────────────────────────────────────────
// OrderDetailModal.tsx
// Modal de detalle completo de un pedido. Se abre al hacer clic en una fila
// de la tabla o en una tarjeta mobile.
//
// Responsabilidades:
//  - Mostrar y editar el estado del pedido (con nota opcional)
//  - Mostrar el historial de estados (OrderTimeline)
//  - Confirmar el pago del pedido (marcado como "abonado")
//  - Mostrar y editar notas internas
//  - Eliminar el pedido (con doble confirmación)
//
// Integración con useUnsavedChanges:
//  El modal marca el contexto global como "dirty" cuando hay cambios sin guardar
//  (estado o notas modificados). Al cerrar, interceptNavigation pregunta al usuario
//  si realmente quiere descartar los cambios.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react'; // useCallback es nuevo si no estaba
import { useAdminOrders } from '../../../../context/AdminOrdersContext';
import { useAdminAuth } from '../../../../context/AdminAuthContext';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';
import { paymentClass, formatDateTime, formatPrice, PAYMENT_LABELS } from '../utils/ordersHelpers';
import toast from 'react-hot-toast';
import type { Order, OrderStatus, PaymentStatus } from '../../../../context/AdminOrdersContext';
import styles from '../AdminOrders.module.css'
import { logAdminActivity } from '../../../../services/adminActivityLogService';
// 2. Agregar el import del hook existente
import { useUnsavedChanges } from '../../../../context/useUnsavedChanges';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderStatusSelector } from '../components/OrderStatusSelector';
import { OrderTimeline } from './OrderTimeline';

// 3. Agregar prop opcional para notificar dirty state al padre

interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
}

/**
 * OrderDetailModal — panel de detalle completo de un pedido.
 *
 * Renderiza como un fullscreen modal (backdrop + panel).
 * En desktop: slide-in desde la derecha.
 * En mobile: slide-up desde abajo (bottom sheet).
 *
 * Permisos requeridos (via `can()` de AdminAuthContext):
 *  - 'orders.edit':     editar estado y notas
 *  - 'orders.markPaid': marcar como abonado
 *  - 'orders.delete':   eliminar pedido
 */
/* ── Modal de detalle ───────────────────────────────────────────── */
const OrderDetailModal = ({ order, onClose }: OrderDetailModalProps) => {
    const { updateOrderStatus, updateOrder, deleteOrder, markAsPaid } = useAdminOrders();
    const { can } = useAdminAuth();

    // ── Estado local del modal ──────────────────────────────────────
    const [notes, setNotes] = useState(order.notes ?? '');

    // `confirmDelete`: muestra el paso de confirmación antes de eliminar
    const [confirmDelete, setConfirmDelete] = useState(false);
    // `confirmPaid`: muestra el paso de confirmación antes de marcar como abonado
    const [confirmPaid, setConfirmPaid] = useState(false);

    // Nota opcional que acompaña al cambio de estado (ej: "enviado por OCA #123")
    const [statusNote, setStatusNote] = useState('');

    /**
     * `pendingStatus`: estado seleccionado en el selector, pendiente de confirmar.
     * No se aplica hasta que el usuario hace clic en "Guardar cambio".
     */
    const [pendingStatus, setPendingStatus] = useState<OrderStatus>(order.status);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);

    // ── Detección de cambios sin guardar (isDirty) ──────────────────
    /**
     * originalStatusRef y originalNotesRef almacenan los valores al momento
     * de abrir el modal (o al guardar exitosamente).
     * Se usan para comparar y determinar si hay cambios pendientes.
     * Se usan refs (no state) para no provocar re-renders en cada comparación.
     */
    const originalStatusRef = useRef(order.status);
    const originalNotesRef = useRef(order.notes ?? '');

    /**
     * isDirty: true si el usuario modificó el estado o las notas sin guardar.
     * Se recalcula en cada render comparando los valores actuales con los originales.
     */
    const isDirty =
        notes !== originalNotesRef.current ||
        pendingStatus !== originalStatusRef.current;

    const { setIsDirty: setGlobalDirty, interceptNavigation } =
        useUnsavedChanges();

    // Sincroniza el flag global cada vez que isDirty cambia localmente
    useEffect(() => {
        console.log('[OrderDetailModal] isDirty local:', isDirty, '→ llamando setGlobalDirty');
        setGlobalDirty(isDirty);
    }, [isDirty, setGlobalDirty]);

    /**
    * handleClose — cierre controlado del modal.
    * `interceptNavigation` pregunta al usuario si hay cambios sin guardar
    * antes de ejecutar `onClose`. Si no hay cambios, cierra directamente.
    */
    const handleClose = useCallback(() => {
        interceptNavigation(onClose);
    }, [interceptNavigation, onClose]);


    const paymentStatus: PaymentStatus = order.paymentStatus ?? 'no-abonado';
    const isAbonado = paymentStatus === 'abonado';

    // `hasStatusChange`: true si el status pendiente difiere del status actual del pedido
    const hasStatusChange = pendingStatus !== order.status;

    // Email del usuario admin para el log de actividad
    const auth = useAdminAuth();
    const userEmail = (auth && (auth.user as any)?.email) || 'desconocido';

    // ── Handlers de acciones ────────────────────────────────────────

    /**
     * handleStatusApply — persiste el cambio de estado en la API.
     *
     * Flujo:
     *  1. Llama a updateOrderStatus con el nuevo estado y la nota opcional.
     *  2. Registra la actividad en el log de auditoría.
     *  3. Actualiza `originalStatusRef` para limpiar el isDirty.
     *  4. Si falla: muestra error y revierte `pendingStatus`.
     */
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
            originalStatusRef.current = pendingStatus; // ← actualizar la baseline
            setStatusNote('');
        } catch (err) {
            setStatusError(err instanceof Error ? err.message : 'Error desconocido');
            toast.error(`No se pudo actualizar el pedido: ${statusError}`);
            setPendingStatus(prev);
        } finally {
            setStatusLoading(false);
        }
    };

    // `currentStatus` se usa para revertir el selector si el usuario cancela
    const currentStatus = order.status;

    /**
     * handleSaveNotes — persiste las notas internas en la API.
     * Actualiza `originalNotesRef` para limpiar el isDirty tras guardar.
     */
    const handleSaveNotes = async () => {
        try {
            await updateOrder(order.id, { notes });
            originalNotesRef.current = notes; // ← actualizar la baseline
            toast.success('Notas guardadas con éxito');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            toast.error(`No se pudieron guardar las notas: ${message}`);
        }
    };

    /**
    * handleDelete — elimina el pedido y cierra el modal.
    * Solo se llega aquí tras pasar por el paso de confirmación (`confirmDelete`).
    */
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

    /** handleMarkAsPaid — marca el pedido como abonado en la API. */
    const handleMarkAsPaid = async (orderId: string) => {
        try {
            await markAsPaid(orderId);
            toast.success('Pedido marcado como abonado');
        } catch {
            toast.error('Error al marcar como abonado');
        }
    };

    // Iniciales del cliente para el avatar (ej: "JP")
    const initials = `${order.customer?.firstName?.[0] ?? ''}${order.customer?.lastName?.[0] ?? ''}`;

    return (
        /*
          Backdrop: clic fuera del panel (e.target === e.currentTarget) cierra el modal.
          Escape también lo cierra via onKeyDown.
        */
        <div
            className={styles.backdrop}
            onClick={e => e.target === e.currentTarget && handleClose()}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Escape' || e.key === 'Enter') && handleClose()}
        >
            <div className={styles.detailPanel} role="dialog" aria-modal="true">
                {/* ── Header: ID del pedido + fecha + botón cerrar ── */}
                <div className={styles.detailHeader}>
                    <div className={styles.detailHeaderInfo}>
                        <h2 className={styles.detailTitle}>Pedido #{order.id.slice(0, 8).toUpperCase()}</h2>
                        <span className={styles.detailDate}>{formatDateTime(order.createdAt)}</span>
                    </div>
                    <button className={styles.closeBtn} onClick={handleClose} type="button" aria-label="Cerrar">✕</button>
                </div>

                {/* ── Cuerpo scrolleable ── */}
                <div className={styles.detailBody}>
                    {/* ── Sección: Estado del pedido ── */}
                    <section className={styles.detailSection}>
                        <h3 className={styles.detailSectionTitle}>Estado del pedido</h3>
                        <div className={styles.statusRow}>
                            {/* Badge de solo lectura que refleja pendingStatus en tiempo real */}
                            <OrderStatusBadge status={pendingStatus} />
                            {can('orders.edit') && (
                                <OrderStatusSelector
                                    value={pendingStatus}
                                    onChange={s => {
                                        const newStatus = s as OrderStatus;
                                        setPendingStatus(newStatus);
                                        // Setear dirty sincrónicamente, sin esperar el useEffect
                                        const newIsDirty = newStatus !== originalStatusRef.current || notes !== originalNotesRef.current;
                                        setGlobalDirty(newIsDirty);
                                    }}
                                    disabled={statusLoading}
                                />
                            )}
                            {statusLoading && <span className={styles.statusLoading} style={{ marginLeft: 6 }}>⏳</span>}
                        </div>
                        {/*
                          Panel de confirmación de cambio de estado.
                          Solo visible si hay un cambio pendiente Y el usuario tiene permiso.
                        */}
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
                                    <button className={styles.applyStatusBtn} type="button" onClick={handleStatusApply} disabled={statusLoading}>
                                        {statusLoading ? 'Guardando...' : 'Guardar cambio'}
                                    </button>
                                    {/* Cancelar revierte pendingStatus al valor actual del pedido */}
                                    <button className={styles.cancelBtn} type="button" onClick={() => { setPendingStatus(currentStatus); setStatusNote(''); }} disabled={statusLoading}>
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

                    {/* ── Sección: Pago ── (solo si tiene permiso) */}
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
                            {/*
                              Flujo de confirmación de pago (dos pasos):
                               1. Clic en "Marcar como abonado" → muestra panel de confirmación
                               2. Clic en "Sí, confirmar pago" → llama handleMarkAsPaid
                            */}
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
                                    // Key compuesta para manejar casos donde productId podría repetirse
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

                    {/* ── Sección: Notas internas ── (solo si tiene permiso) */}
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

                    {/* ── Sección: Zona peligrosa ── (solo si tiene permiso) */}
                    {can('orders.delete') && (
                        <section className={styles.detailSection}>
                            <h3 className={styles.detailSectionTitle}>Zona peligrosa</h3>
                            <div className={styles.dangerSection}>
                                {/*
                                  Flujo de eliminación (dos pasos):
                                   1. Clic en "Eliminar este pedido" → muestra confirmación
                                   2. Clic en "Sí, eliminar" → llama handleDelete
                                */}
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
export default OrderDetailModal;