import { Tooltip } from '../../../components/ui/Tooltip/Tooltip';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useAdminOrders } from '../../../context/AdminOrdersContext';
import type { Order, OrderStatus } from '../../../context/AdminOrdersContext';
import { STATUS_LABELS, STATUS_OPTIONS } from './utils/ordersHelpers';
import toast from 'react-hot-toast';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminOrders.module.css';
import { ModalConfirm } from '../../../components/ui/ModalConfirm/ModalConfirm';
import { OrdersHeader } from './components/OrdersHeader';
import { OrdersTable } from './components/OrdersTable';
import { OrderList } from './components/OrderList';
import { Notification } from '../../../components/ui/Notification';
import { useReportsExport } from '../reports/hooks/useReportsExport';
import { OrdersFiltersBar } from './components/OrdersFiltersBar';
import { useOrdersFilters } from './hooks/useOrdersFilters';
import { fetchAdminOrders, mapApiOrderToOrder } from './ordersService';
import { ExportButtons } from '../../../components/ui/ExportButtons';
import { AdminPagination } from '../../../components/ui/AdminPagination/AdminPagination';
import { SummarySkeleton, TableRowSkeleton, MobileCardSkeleton } from './components/OrderSkeletons';


function AdminOrders() {
  const { token } = useAdminAuth();
  const { bulkUpdateOrderStatus } = useAdminOrders();
  const navigate = useNavigate();

  /**
   * Lista completa de pedidos cargados desde el backend.
   */
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Paginación ──────────────────────────────────────────────────
  // `page` determina qué página se solicita al backend.
  // PAGE_SIZE define cuántos registros por página.
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // Si el backend devuelve totalPages, actualizarlo en fetchOrders
  const PAGE_SIZE = 10;

  // IDs de pedidos seleccionados para acciones masivas
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ── Filtros ─────────────────────────────────────────────────────
  /**
   * useOrdersFilters devuelve:
   *  - filters: estado actual de todos los filtros
   *  - setFilters: setter para actualizar filtros
   *  - hasActiveFilters: true si hay algún filtro activo (para mostrar "Limpiar")
   *  - filtered: subconjunto de `orders` que pasa todos los filtros activos
   *  - reset: resetea todos los filtros a sus valores vacíos
   */
  const { filters, setFilters, hasActiveFilters, filtered, reset } = useOrdersFilters(orders)

  /**
   * debouncedFilters: copia de `filters` que se actualiza con 400ms de delay.
   * Se usa para resetear la página solo cuando el usuario deja de escribir,
   * evitando resets en cada keystroke.
   */
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  /**
   * adaptedFilters: transforma el estado de filtros al formato que espera
   * useReportsExport para saber qué tipo de filtro aplicar en la exportación.
   *
   * Lógica:
   *  - Si hay rango de fechas → type: 'custom'
   *  - Si hay exactamente 1 estado seleccionado → type: 'predefined', period: ese estado
   *  - En cualquier otro caso → type: 'predefined', period: 'todos'
   */
  const adaptedFilters = useMemo(() => {
    if (filters.dateFrom || filters.dateTo) {
      return { type: 'custom' } as const;
    }

    if (filters.status) {
      return {
        type: 'predefined',
        period: filters.status,
      } as const;
    }

    return {
      type: 'predefined',
      period: 'todos',
    } as const;
  }, [filters]);

  // Debounce de 400ms sobre los filtros para evitar resets de página continuos
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 400);

    return () => clearTimeout(t);
  }, [filters]);

  // Volver a la primera página cada vez que los filtros (debounced) cambien
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  // ── Fetch paginado ──────────────────────────────────────────────
  /**
   * abortRef almacena el AbortController del fetch en curso.
   * Si se dispara un nuevo fetch antes de que termine el anterior,
   * se aborta el anterior para evitar race conditions.
   */
  const abortRef = useRef<AbortController | null>(null);

  /**
   * fetchOrders — obtiene pedidos del backend con paginación.
   *
   * @param reset - Si true, reemplaza la lista; si false, agrega al final (infinite scroll).
   *
   * NOTA: El useEffect que llama a fetchOrders(true) está comentado porque
   * actualmente se usan MOCK_ORDERS. Descomentar para activar el fetch real.
   */
  const fetchOrders = useCallback(async (reset = false) => {
    if (!token) return;

    // Abortar fetch anterior si todavía está en curso
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: reset ? 1 : page,
        limit: PAGE_SIZE,
      };

      // Pasar búsqueda al backend (server-side)
      if (debouncedFilters.search) params.q = debouncedFilters.search;
      // Cuando hay exactamente un estado seleccionado, filtrar en el backend
      // Con múltiples estados, el filtro client-side en useOrdersFilters se encarga
      if (debouncedFilters.status.length === 1) params.status = debouncedFilters.status[0];

      const res = await fetchAdminOrders(token, params);
      const normalized = res.data.map(mapApiOrderToOrder);

      // reset=true reemplaza la lista; reset=false acumula (para load more)
      setTotalPages(res.totalPages); // Si el backend devuelve totalPages, actualizarlo
      setOrders(prev => reset ? normalized : [...prev, ...normalized]);
    } catch (e: unknown) {
      // Ignorar errores de abort; solo mostrar toast si fue un error real
      if (e instanceof Error && e.name !== 'AbortError') toast.error('Error al cargar pedidos');
    } finally {
      setIsLoading(false);
    }
  }, [token, page, PAGE_SIZE, debouncedFilters]);

  // Cargar pedidos al montar y cada vez que cambien los filtros (debounced) o el token
  useEffect(() => {
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, debouncedFilters, page]);

  // Cargar más cuando el usuario avanza de página (solo si page > 1)
  /*useEffect(() => {
    if (page === 1) return;
    fetchOrders(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);*/

  // Helpers selección múltiple
  // ── Selección múltiple ──────────────────────────────────────────
  /**
   * handleSelectOne — agrega o quita un ID de la selección (toggle).
   * useCallback evita recrear la función en cada render; es estable mientras
   * no cambien sus dependencias (ninguna en este caso).
   */
  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  /** Limpia toda la selección. Llamado tras ejecutar una acción masiva. */
  const clearSelection = useCallback(() => setSelectedIds([]), []);

  // ── Métricas de resumen ─────────────────────────────────────────
  /**
   * summary — cuenta pedidos por estado para las tarjetas de métricas.
   * useMemo evita recalcular en cada render; se actualiza solo cuando `orders` cambia.
   *
   * Resultado: { pendiente: N, confirmado: N, 'en-preparacion': N, ... }
   */
  // Resumen por estado
  const summary = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, s) => {
      acc[s] = orders.filter(o => o.status === s).length;
      return acc;
    }, {} as Record<OrderStatus, number>);
  }, [orders]);

  /** Total de pedidos con paymentStatus === 'abonado' para la tarjeta de pagos. */
  const totalAbonados = useMemo(() => orders.filter(o => o.paymentStatus === 'abonado').length, [orders]);

  // ── Modal de confirmación global ────────────────────────────────
  /**
   * `modal` centraliza el estado del ModalConfirm reutilizable.
   * `type` determina qué mensaje y título se muestran.
   * `payload` transporta datos extra (ej: el nuevo status a aplicar).
   */
  const [modal, setModal] = useState<{
    open: boolean;
    type: 'delete' | 'status' | 'paid' | null;
    order: Order | null;
    payload?: Record<string, unknown>;
    isLoading?: boolean;
    message?: string;
  }>({ open: false, type: null, order: null });

  // ── Acciones masivas ────────────────────────────────────────────
  /**
   * BulkAction — acciones disponibles para pedidos seleccionados en bloque.
   *  - 'confirm': pendiente → confirmado
   *  - 'ship':    confirmado/en-preparacion → enviado
   *  - 'cancel':  cualquier estado excepto enviado/entregado/cancelado
   */
  type BulkAction = 'confirm' | 'ship' | 'cancel';
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ── Exportación ─────────────────────────────────────────────────
  const {
    notif, setNotif,
    exportLoading,
    showExportModal, setShowExportModal,
    exportFormat, setExportFormat,
    handleExport,
  } = useReportsExport(filtered, adaptedFilters, token);

  /** Dispara exportación directa sin modal para el formato indicado */
  const triggerExport = useCallback((format: 'csv' | 'xlsx' | 'pdf') => {
    if (!filtered.length) {
      setNotif({ open: true, type: 'error', message: 'No hay pedidos para exportar.' });
      return;
    }
    setExportFormat(format);
    // Pequeño defer para que setExportFormat se aplique antes de handleExport
    setTimeout(() => setShowExportModal(true), 0);
  }, [filtered.length, setExportFormat, setShowExportModal, setNotif]);

  // ── Validaciones de acciones masivas ───────────────────────────
  /**
   * canBulkAction — valida si una acción masiva es aplicable a los pedidos seleccionados.
   * Devuelve false si alguno de los pedidos seleccionados tiene un estado incompatible.
   *
   * Reglas:
   *  - 'confirm': todos deben estar en 'pendiente'
   *  - 'ship':    todos deben estar en 'confirmado' o 'en-preparacion'
   *  - 'cancel':  ninguno puede estar en 'enviado', 'entregado' o 'cancelado'
   */
  const canBulkAction = useCallback((action: BulkAction, orders: Order[]): boolean => {
    if (action === 'confirm') return orders.every(o => o.status === 'pendiente');
    if (action === 'ship') return orders.every(o => o.status === 'confirmado' || o.status === 'en-preparacion');
    if (action === 'cancel') return orders.every(o => o.status !== 'enviado' && o.status !== 'entregado' && o.status !== 'cancelado');
    return false;
  }, []);

  /** Texto legible para mostrar en el modal de confirmación de acción masiva. */
  const getBulkActionLabel = (action: BulkAction): string => {
    if (action === 'confirm') return 'Confirmar';
    if (action === 'ship') return 'Marcar como Enviado';
    if (action === 'cancel') return 'Cancelar';
    return '';
  };

  /** Abre el modal de confirmación de acción masiva con la acción seleccionada. */
  const handleBulkAction = useCallback((action: BulkAction) => {
    setBulkAction(action);
    setBulkModalOpen(true);
  }, []);

  /**
   * executeBulkAction — ejecuta la acción masiva confirmada llamando al
   * contexto real (bulkUpdateOrderStatus). Refresca los pedidos afectados
   * en la lista local y reporta el resultado al usuario.
   */
  const executeBulkAction = useCallback(async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const result = await bulkUpdateOrderStatus({
        orderIds: selectedIds,
        action: bulkAction,
      });
      const failed = result.results.filter((r) => !r.success).length;
      const ok = result.results.length - failed;
      if (ok > 0) toast.success(`${ok} pedido${ok !== 1 ? 's' : ''} actualizado${ok !== 1 ? 's' : ''}`);
      if (failed > 0) toast.error(`${failed} pedido${failed !== 1 ? 's' : ''} no pudieron actualizarse`);
      await fetchOrders(true);
    } catch {
      toast.error('Error al aplicar la acción masiva');
    } finally {
      setBulkModalOpen(false);
      setBulkLoading(false);
      setBulkAction(null);
      clearSelection();
    }
  }, [bulkAction, selectedIds, bulkUpdateOrderStatus, fetchOrders, clearSelection]);

  // ── Handlers del modal global ───────────────────────────────────
  const handleCloseModal = useCallback(() => {
    setModal({ open: false, type: null, order: null });
  }, []);

  /**
   * handleConfirmModal — cierra el modal global individual.
   * Las acciones reales (delete / status / paid) se gestionan en la
   * página de detalle de pedido; aquí solo se cierra de forma segura.
   */
  const handleConfirmModal = useCallback(async () => {
    setModal({ open: false, type: null, order: null });
  }, []);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <main className={`${sectionStyles.page} dark:bg-gray-900 dark:text-gray-100`} tabIndex={-1} aria-label="Gestión de pedidos">
      {/* Header */}
      <OrdersHeader />

      {/* Resumen / Métricas rápidas */}
      <section className={styles.summary} aria-label="Resumen de pedidos">
        {isLoading ? (
          // Mostrar 6 skeletons mientras carga (uno por cada tarjeta de estado)
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
              <span className={styles.summaryLabel}>Total pedidos</span>
              <span className={styles.summaryNum}>{orders.length}</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardPendiente}`}>
              <span className={styles.summaryLabel}>Pendientes</span>
              <span className={`${styles.summaryNum} ${styles.numPendiente}`}>{summary.pendiente}</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardPreparacion}`}>
              <span className={styles.summaryLabel}>En preparación</span>
              <span className={`${styles.summaryNum} ${styles.numPreparacion}`}>{summary['en-preparacion']}</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardEnviado}`}>
              <span className={styles.summaryLabel}>Enviados</span>
              <span className={`${styles.summaryNum} ${styles.numEnviado}`}>{summary.enviado}</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardEntregado}`}>
              <span className={styles.summaryLabel}>Entregados</span>
              <span className={`${styles.summaryNum} ${styles.numEntregado}`}>{summary.entregado}</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardAbonado}`}>
              <span className={styles.summaryLabel}>Abonados</span>
              <span className={`${styles.summaryNum} ${styles.numAbonado}`}>{totalAbonados}</span>
            </div>
          </>
        )}
      </section>

      {/* Exportación */}
      <section className={styles.exportWrap} aria-label="Exportar pedidos">
        <ExportButtons
          onExportCSV={() => triggerExport('csv')}
          onExportExcel={() => triggerExport('xlsx')}
          onExportPDF={() => triggerExport('pdf')}
          loading={exportLoading}
          disabled={filtered.length === 0}
        />

        {/* Modal de confirmación antes de exportar */}
        <ModalConfirm
          open={showExportModal}
          title="Exportar pedidos"
          message={`¿Exportar ${filtered.length} pedido${filtered.length !== 1 ? 's' : ''} como ${exportFormat.toUpperCase()}?`}
          confirmText={exportLoading ? 'Exportando…' : 'Exportar'}
          cancelText="Cancelar"
          onConfirm={handleExport}
          onCancel={() => setShowExportModal(false)}
        />

        {/* Notificación de resultado */}
        <Notification
          open={notif.open}
          type={notif.type}
          message={notif.message}
          onClose={() => setNotif(n => ({ ...n, open: false }))}
        />
      </section>

      {/* ── Barra de filtros ── */}
      {/*
        onChange actualiza `filters` inmediatamente (sin debounce).
        El debounce se aplica internamente en AdminOrders para el reset de página.
      */}
      <OrdersFiltersBar
        filters={filters}
        onChange={setFilters}
        onReset={reset}
        hasActiveFilters={hasActiveFilters}
        disabled={isLoading}
      />

      {/* ── Lista de pedidos ── */}
      {isLoading ? (
        // Estado de carga: skeleton de tabla + skeleton de cards mobile
        <>
          <SummarySkeleton />
          {/* Aquí puedes agregar skeletons para tabla y mobile si lo deseas */}
          <div className={styles.tableWrapper} style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <table className={styles.table} style={{ minWidth: 900 }} aria-label="Pedidos" aria-describedby="orders-count">
              <caption className="sr-only">Lista de pedidos de clientes</caption>
              <thead>
                <tr>
                  <th style={{ width: 48 }} scope="col"></th>
                  <th style={{ textAlign: 'left', padding: '18px 20px' }} scope="col">N° Pedido</th>
                  <th style={{ textAlign: 'left', padding: '18px 20px' }} scope="col">Fecha</th>
                  <th style={{ textAlign: 'left', padding: '18px 20px' }} scope="col">Cliente</th>
                  <th style={{ textAlign: 'left', padding: '18px 20px' }} scope="col">Productos</th>
                  <th style={{ textAlign: 'right', padding: '18px 20px' }} scope="col">Total</th>
                  <th style={{ textAlign: 'left', padding: '18px 20px' }} scope="col">Estado</th>
                  <th style={{ width: 80 }} scope="col"></th>
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
        // Estado vacío: no hay pedidos que coincidan con los filtros activos
        <div className={sectionStyles.emptyState}>
          <span className={sectionStyles.emptyIcon}>🛒</span>
          <p className={sectionStyles.emptyText}>No se encontraron pedidos con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          {/*
            OrdersTable: vista de escritorio (oculta en mobile via CSS).
            OrderList:   vista de tarjetas para mobile (oculta en desktop via CSS).
            Ambas consumen `filtered`, no `orders`, para respetar los filtros activos.
          */}
          <OrdersTable
            orders={filtered}
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onDetail={(order) => navigate(`/admin/pedidos/${order.id}`)}
          />
          <OrderList
            orders={filtered}
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onDetail={(order) => navigate(`/admin/pedidos/${order.id}`)}
          />
          {/* ── Paginación ── */}
          {/*
            La paginación calcula el total de páginas en base a `orders.length` y PAGE_SIZE.
            Al cambiar de página, el useEffect de fetchOrders(false) se dispara
            para cargar la siguiente página desde el backend.
          */}
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Paginación de pedidos"
          />

          {/* ── Toolbar de acciones masivas ── */}
          {/*
            Solo visible cuando hay al menos un pedido seleccionado.
            Aparece como barra fija en la parte inferior de la pantalla (posición fixed en CSS).
            Los botones se deshabilitan si la acción no es compatible con la selección actual.
          */}
          {
            selectedIds.length > 0 && (
              <div className={styles.bulkActionsContainer}>
                <div className={styles.bulkActionsBox}>
                  <span className={styles.bulkActionsTitle}>
                    {selectedIds.length} seleccionados
                  </span>

                  <Tooltip content="Confirmar todos los pedidos seleccionados">
                    <button
                      type="button"
                      // Solo habilitado si TODOS los seleccionados están en 'pendiente'
                      disabled={!canBulkAction('confirm', orders.filter(o => selectedIds.includes(o.id)))}
                      onClick={() => handleBulkAction('confirm')}
                      className={`${styles.bulkBtn} ${styles.bulkBtnConfirm}`}
                      aria-label="Confirmar pedidos seleccionados"
                    >
                      Confirmar
                    </button>
                  </Tooltip>

                  <Tooltip content="Marcar como enviados los pedidos seleccionados">
                    <button
                      type="button"
                      // Solo habilitado si TODOS están en 'confirmado' o 'en-preparacion'
                      disabled={!canBulkAction('ship', orders.filter(o => selectedIds.includes(o.id)))}
                      onClick={() => handleBulkAction('ship')}
                      className={`${styles.bulkBtn} ${styles.bulkBtnShip}`}
                      aria-label="Marcar como enviados"
                    >
                      Enviado
                    </button>
                  </Tooltip>

                  <Tooltip content="Cancelar todos los pedidos seleccionados">
                    <button
                      type="button"
                      // Bloqueado si alguno ya está en 'enviado', 'entregado' o 'cancelado'
                      disabled={!canBulkAction('cancel', orders.filter(o => selectedIds.includes(o.id)))}
                      onClick={() => handleBulkAction('cancel')}
                      className={`${styles.bulkBtn} ${styles.bulkBtnCancel}`}
                      aria-label="Cancelar pedidos seleccionados"
                    >
                      Cancelar
                    </button>
                  </Tooltip>

                  <button
                    type="button"
                    onClick={clearSelection}
                    className={styles.bulkBtnClear}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )
          }

          {/* Modal de confirmación de acción masiva */}
          {
            bulkModalOpen && bulkAction && (
              <ModalConfirm
                open={bulkModalOpen}
                title={`Acción masiva: ${getBulkActionLabel(bulkAction!)}`}
                message={`¿Seguro que deseas aplicar "${getBulkActionLabel(bulkAction!)}" a los ${selectedIds.length} pedidos seleccionados? Esta acción no se puede deshacer.`}
                confirmText={bulkLoading ? 'Procesando...' : 'Confirmar'}
                cancelText={'Cancelar'}
                // Bloquear los handlers mientras carga para evitar doble envío
                onConfirm={bulkLoading ? () => { } : executeBulkAction}
                onCancel={bulkLoading ? () => { } : () => setBulkModalOpen(false)}
              />
            )
          }
        </>
      )
      }

      {/* ── Modal global de confirmación (delete / status / paid) ── */}
      {/*
        Modal reutilizable para acciones críticas individuales.
        El título y mensaje se derivan de `modal.type` y `modal.payload`.
        Los handlers se bloquean durante modal.isLoading para evitar doble envío.
      */}
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
            : modal.type === 'status' && typeof modal.payload?.status === 'string'
              ? `¿Confirmar cambio de estado a "${STATUS_LABELS[modal.payload.status as OrderStatus]}"?`
              : modal.type === 'paid'
                ? '¿Confirmar que el cliente abonó este pedido?'
                : ''
        }
        confirmText={modal.isLoading ? 'Procesando...' : 'Confirmar'}
        cancelText={'Cancelar'}
        onConfirm={modal.isLoading ? () => { } : handleConfirmModal}
        onCancel={modal.isLoading ? () => { } : handleCloseModal}
      />

    </main>
  );
}

export default AdminOrders;
