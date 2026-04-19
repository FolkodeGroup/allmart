// ─────────────────────────────────────────────────────────────────────────────
// AdminOrders.tsx
// Página principal de gestión de pedidos del panel de administración.
//
// Responsabilidades:
//  - Renderizar métricas de resumen por estado
//  - Orquestar filtros, paginación y selección múltiple
//  - Gestionar acciones masivas (confirmar / enviar / cancelar)
//  - Exportar pedidos en distintos formatos
//  - Abrir el modal de detalle de un pedido
//
// Flujo general:
//  1. Al montar, los pedidos se inicializan con MOCK_ORDERS (modo dev).
//  2. El hook useOrdersFilters filtra `orders` según los filtros activos.
//  3. La tabla y la lista mobile consumen `filtered` (no `orders` directamente).
//  4. La paginación opera sobre `orders` completo; el slice lo hace el backend
//     cuando el fetch real esté activo.
// ─────────────────────────────────────────────────────────────────────────────


import { Tooltip } from '../../../components/ui/Tooltip/Tooltip';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import type { Order } from '../../../context/AdminOrdersContext';
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

/**
 * MOCK_ORDERS — datos de ejemplo para desarrollo local.
 * Reemplazar por el fetch real cuando el backend esté disponible
 * (descomentar el useEffect de fetchOrders más abajo).
 *
 * Estructura mínima esperada por el tipo Order:
 *  id, createdAt, customer, items, total, status, paymentStatus, statusHistory
 */
import type { OrderStatus } from '../../../context/AdminOrdersContext';

// Importar componentes y hooks faltantes
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import OrderDetailModal from './components/OrderDetailModal';




function AdminOrders() {
  const { token } = useAdminAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // Pedido actualmente abierto en el modal de detalle (null = modal cerrado)

  /**
   * Lista completa de pedidos cargados.
   * En desarrollo se inicializa con MOCK_ORDERS.
   * En producción, se pobla via fetchOrders (ver useEffect comentado más abajo).
   */
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Paginación ──────────────────────────────────────────────────
  // `page` determina qué página se solicita al backend.
  // PAGE_SIZE define cuántos registros por página.
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // IDs de pedidos seleccionados para acciones masivas
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Acceso al contexto global de cambios sin guardar
  const { setIsDirty: setGlobalDirty } = useUnsavedChanges();

  // const [total, setTotal] = useState(0); // Si se requiere mostrar total, descomentar

  // Las siguientes funciones pueden dejarse como mocks vacíos o comentarios si se usan en la UI
  // Se aceptan argumentos para evitar errores de cantidad de argumentos
  //const bulkUpdateOrderStatus = (..._args: any[]) => Promise.resolve({ success: 0, failed: 0 });
  //const updateOrderStatus = (..._args: any[]) => Promise.resolve();
  //const deleteOrder = (..._args: any[]) => Promise.resolve();
  //const markAsPaid = (..._args: any[]) => Promise.resolve();

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

    if (filters.statuses.length === 1) {
      return {
        type: 'predefined',
        period: filters.statuses[0],
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
    if (reset) setIsLoading(true);
    else setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: PAGE_SIZE,
      };

      const res = await fetchAdminOrders(token, params);
      // setHasMore(res.data.length === PAGE_SIZE);
      const normalized = res.data.map(mapApiOrderToOrder);

      // reset=true reemplaza la lista; reset=false acumula (para infinite scroll)
      setOrders(prev => reset ? normalized : [...prev, ...normalized]);
    } catch (e: any) {
      // Ignorar errores de abort; solo mostrar toast si fue un error real
      if (e.name !== 'AbortError') toast.error('Error al cargar pedidos');
    } finally {
      setIsLoading(false);
      setIsLoading(false);
    }
  }, [token, page, PAGE_SIZE]);

  // Cargar pedidos al montar y al cambiar filtros
  useEffect(() => {
    fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Cargar más cuando el usuario avanza de página (solo si page > 1)
  useEffect(() => {
    if (page === 1) return;
    fetchOrders(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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

  // ── Skeletons de carga ──────────────────────────────────────────
  // Definidos como componentes locales para mantener el JSX del return limpio.
  // No reciben props; solo replican la estructura visual con placeholders animados.
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
  /**
   * useReportsExport gestiona el flujo completo de exportación:
   *  - `filtered`: pedidos a exportar (ya filtrados por la UI)
   *  - `adaptedFilters`: metadata del filtro para el reporte
   *
   * Expone: notif, exportLoading, showExportModal, exportFormat, handleExport
   */
  const {
    notif, setNotif,
    exportLoading,
    showExportModal, setShowExportModal,
    exportFormat, setExportFormat,
    handleExport,
  } = useReportsExport(filtered, adaptedFilters);

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
   * executeBulkAction — ejecuta la acción masiva confirmada.
   * TODO: reemplazar el setTimeout simulado por la llamada real al contexto
   * (ej: bulkUpdateOrderStatus de AdminOrdersContext).
   */
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

  // ── Handlers del modal global ───────────────────────────────────
  const handleCloseModal = useCallback(() => {
    setModal({ open: false, type: null, order: null });
  }, []);

  /**
   * handleConfirmModal — simula la confirmación de una acción en el modal global.
   * TODO: conectar con la acción real según modal.type (delete / status / paid).
   */
  const handleConfirmModal = useCallback(async () => {
    setModal(m => ({ ...m, isLoading: true }));
    setTimeout(() => {
      toast.success('Acción simulada');
      setModal({ open: false, type: null, order: null });
    }, 1000);
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
        <div className={styles.exportWrap}>
          <span className={styles.exportLabel}>Exportar tabla de pedidos como:</span>
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
                // Validar antes de abrir el modal: no exportar si no hay pedidos
                if (!filtered.length) {
                  setNotif({ open: true, type: 'error', message: 'No hay pedidos para exportar.' });
                  return;
                }
                setShowExportModal(true);
              }}
              disabled={exportLoading !== null || filtered.length === 0}
              aria-label={`Exportar pedidos como ${exportFormat.toUpperCase()}`}
              title={filtered.length === 0 ? 'No hay pedidos para exportar' : `Exportar ${filtered.length} pedidos como ${exportFormat.toUpperCase()}`}
            >
              {exportLoading ? '⏳ Exportando…' : '⬇ Exportar'}
            </button>
          </div>
        </div>

        {/* Modal de confirmación antes de exportar */}
        <ModalConfirm
          open={showExportModal}
          title="Exportar pedidos"
          message={`¿Exportar ${orders.length} pedido${orders.length !== 1 ? 's' : ''} como ${exportFormat.toUpperCase()}?`}
          confirmText={exportLoading ? 'Exportando…' : 'Exportar'}
          cancelText="Cancelar"
          onConfirm={handleExport}
          onCancel={() => setShowExportModal(false)}
        />

        {/* Notificación de resultado de exportación (éxito o error) */}
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
      ) : orders.length === 0 ? (
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
            onDetail={setSelectedOrder}
          />
          <OrderList
            orders={filtered}
            selectedIds={selectedIds}
            onSelect={handleSelectOne}
            onDetail={setSelectedOrder}
          />
          {/* ── Paginación ── */}
          {/*
            La paginación calcula el total de páginas en base a `orders.length` y PAGE_SIZE.
            Al cambiar de página, el useEffect de fetchOrders(false) se dispara
            para cargar la siguiente página desde el backend.
          */}
          <nav className={styles.paginationWrap} aria-label="Paginación de pedidos">
            <button
              className={styles.paginationBtn}
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <span className={styles.paginationBtnIcon}>←</span> Anterior
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
              Siguiente <span className={styles.paginationBtnIcon}>→</span>
            </button>
          </nav>

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

      {/* ── Modal de detalle del pedido ── */}
      {/*
        Solo se monta cuando hay un pedido seleccionado.
        `orders.find(...)` garantiza que se pasa la versión más reciente del pedido
        (por si fue modificado mientras el modal estaba cerrado), usando `selectedOrder`
        como fallback en caso de que ya no exista en la lista.
      */}
      {selectedOrder && (
        <OrderDetailModal
          order={(orders.find(o => o.id === selectedOrder!.id) ?? selectedOrder!)}
          onClose={() => {
            setSelectedOrder(null);
            setGlobalDirty(false); // limpiar al cerrar
          }}
        />
      )}



    </main>
  );
}

export default AdminOrders;
