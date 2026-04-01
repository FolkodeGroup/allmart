
import React, { useMemo, useState, useEffect, useRef } from 'react';
//import { useAdminOrders } from '../../../context/AdminOrdersContext';
import type { Order } from '../../../context/AdminOrdersContext';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminReports.module.css';
import { useReportsPdfExport } from './useReportsPdfExport';
import { PrintableReport } from './PrintableReport';
import { ReportsFilters } from './components/ReportsFilters';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';
import type { ReportsFiltersValue, PredefinedPeriod } from './components/ReportsFilters';
import { ReportsMetrics } from './components/ReportsMetrics';
import { OrdersTable } from './components/OrdersTable';
import { Pagination } from './components/Pagination';
import { Suspense } from 'react';
import { Notification } from '../../../components/ui/Notification';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { exportOrdersCSV, exportOrdersXLSX, exportOrdersPDF, getExportFileName } from '../../../utils/exportHelpers';
import { generateMockOrders } from './components/DatosMockeados';
import { ProductRanking } from './components/ReportsProductRanking';
import { OrdersFilters } from './components/OrdersFilters';
import { SalesTableView } from './components/SalesTableView';
import {
  createdAtToMs, parseDateStartLocal, formatDateLocal,
  getDayKeyLocalFromMs,
} from '../../../utils/date';
import { useReportsData } from './hooks/useReportsData';

/* ── Helpers ──────────────────────────────────────────────────── */
function formatPrice(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n);
}

function formatPriceShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function isoDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

/* Genera array de fechas [YYYY-MM-DD] de los últimos N días */
function lastNDayKeys(n: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  for (let i = n - 1; i >= 0; i--) {
    const dayMs = todayMs - i * 24 * 60 * 60 * 1000;
    keys.push(getDayKeyLocalFromMs(dayMs));
  }
  return keys;
}

function orderDateKey(createdAt: string): string {
  // Normaliza a ms y luego a key local
  const ms = createdAtToMs(createdAt);
  return getDayKeyLocalFromMs(ms);
}

/* ── Tipos internos ─────────────────────────────────────────────── */
type Period = PredefinedPeriod | 'custom';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
  'all': 'Todo el tiempo',
  'custom': 'Rango personalizado',
};

// Lazy loading de gráficos optimizado (cada chunk por separado, no se recrea en cada render)
const BarChart = React.lazy(() => import('./components/BarChart'));
const DonutChart = React.lazy(() => import('./components/DonutChart'));


export interface OrdersTableProps {
  orders: Order[];
}

/* ── Componente principal ─────────────────────────────────────── */
/**
 * Vista principal de reportes administrativos.
 *
 * Orquesta filtros, métricas, gráficos y tabla de pedidos.
 * - Maneja estado de filtros, paginación y exportación.
 * - Conecta los datos filtrados con los componentes visuales.
 * - Implementa protección ante cambios no guardados.
 *
 * @module AdminReports
 */
export function AdminReports() {

  //const { orders } = useAdminOrders();
  const orders = useMemo(() => generateMockOrders(50), []);
  const [isLoading] = useState(false);
  const [filters, setFilters] = useState<ReportsFiltersValue>({ type: 'predefined', period: '30d' });
  // Unsaved changes detection
  const {
    setIsDirty,
    showWarning,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChangesWarning({ active: true });
  // Eliminado: showUnsavedModal, setShowUnsavedModal (no se usan más)
  // Filtros avanzados SOLO para la tabla de pedidos
  const [ordersTableFilters, setOrdersTableFilters] = useState<{ status: string[]; clientQuery: string; productQuery: string }>({ status: [], clientQuery: '', productQuery: '' });
  const [now, setNow] = useState(() => Date.now());
  // Estado de paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Feedback de exportación
  const [showExportModal, setShowExportModal] = useState(false);
  const [notif, setNotif] = useState<{ open: boolean; type: 'success' | 'error'; message: string }>({ open: false, type: 'success', message: '' });
  const [exportLoading, setExportLoading] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  // Estados para alternar la vista del top de productos (lista vs tarjetas)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  // PDF export
  const pdfRootRef = useRef<HTMLDivElement>(null); // para la UI visible
  const hiddenPdfRef = useRef<HTMLDivElement>(null); // para exportación offscreen
  const { generatePdf, loading: pdfLoading } = useReportsPdfExport();
  // Estado para mostrar/ocultar el contenedor offscreen
  const [showHiddenPdf, setShowHiddenPdf] = useState(false);
  // Estado para cambiar vista de gráfico barchart
  const [salesViewMode, setSalesViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    if (!showHiddenPdf) return;
    generatePdf({ rootRef: hiddenPdfRef, fileName: 'reporte-resumen.pdf' })
      .then(() => setNotif({ open: true, type: 'success', message: 'PDF generado.' }))
      .catch(() => setNotif({ open: true, type: 'error', message: 'Error generando PDF.' }))
      .finally(() => setShowHiddenPdf(false));
  }, [showHiddenPdf, generatePdf]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [pageSize, filters]);

  // Detectar cambios en filtros generales o de pedidos
  useEffect(() => {
    setIsDirty(true);
  }, [filters, setIsDirty]);

  // Bloquear navegación interna (react-router-dom v6+)
  // Si usas react-router, puedes usar useBlocker o usePrompt aquí

  // Determinar periodo para lógica existente

  // Calcular min/max fechas para inputs
  const allDates = orders.map(o => {
    // normaliza strings YYYY-MM-DD o ISO con hora
    const ms = createdAtToMs(o.createdAt);
    return formatDateLocal(new Date(ms));
  });
  const minDate = allDates.length ? allDates.reduce((a, b) => a < b ? a : b) : undefined;
  const maxDate = allDates.length ? allDates.reduce((a, b) => (a > b ? a : b)) : undefined;

  const ordersWithTime = useMemo(() => {
    return orders.map(o => ({
      ...o,
      createdAtMs: createdAtToMs(o.createdAt)
    }))
  },
    [orders]);

  // Filtrado extendido
  // periodOrders: solo filtra por período (filtros generales)
  const {
    period,
    periodOrders,
    filteredOrdersTable,
    activeOrders,
    kpis
  } = useReportsData(
    orders,
    filters,
    ordersTableFilters,
    now
  );

  /* ── Comparativa período anterior ── */
  const prevPeriodRevenue = useMemo(() => {
    if (period === 'all') return null;

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    const prevOrders = ordersWithTime.filter(o =>
      o.createdAtMs >= now - days * 2 * 86400000 &&
      o.createdAtMs < now - days * 86400000 &&
      o.status !== 'cancelado'
    );

    return prevOrders.reduce((s, o) => s + o.total, 0);
  }, [ordersWithTime, period, now]);



  const KPISkeleton = () => (
    <div className={styles.kpiCard}>
      <div className={styles.skeletonKPIIcon}></div>
      <div className={styles.kpiBody}>
        <div className={styles.skeletonKPIValue}></div>
        <div className={styles.skeletonKPILabel}></div>
      </div>
    </div>
  );

  const revenueChange = prevPeriodRevenue !== null && prevPeriodRevenue > 0
    ? ((kpis.totalRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100
    : null;

  // Métricas para ReportsMetrics
  const metrics = [
    {
      key: 'revenue',
      icon: '💰',
      label: 'Ingresos totales',
      value: formatPrice(kpis.totalRevenue),
      trend: revenueChange ?? undefined,
    },
    {
      key: 'orders',
      icon: '🛒',
      label: 'Pedidos activos',
      value: kpis.orderCount,
    },
    {
      key: 'avgTicket',
      icon: '🎯',
      label: 'Ticket promedio',
      value: formatPrice(kpis.avgTicket),
    },
    {
      key: 'completion',
      icon: '✅',
      label: 'Tasa de entrega',
      value: `${kpis.completionRate}%`,
    },
    {
      key: 'paid',
      icon: '💬',
      label: 'Abonados (WhatsApp)',
      value: kpis.paid,
    },
  ];

  const dayKeys = useMemo(() => {
    if (filters.type === 'predefined') {
      if (filters.period === 'all') return [];

      const days =
        filters.period === '7d' ? 7 :
          filters.period === '30d' ? 30 : 90;

      return lastNDayKeys(days);
    }

    // custom range
    if (filters.type === 'custom') {
      const { from: rangeFrom, to: rangeTo } = filters.range;
      if (!rangeFrom || !rangeTo) return [];

      const result: string[] = [];
      let currentMs = parseDateStartLocal(rangeFrom);
      const endMs = parseDateStartLocal(rangeTo);

      while (currentMs <= endMs) {
        result.push(formatDateLocal(new Date(currentMs)));
        currentMs += 86400000; // +1 día
      }

      return result;
    }

    return [];
  }, [filters]);

  /* ── Datos para BarChart ── */
  const barData = useMemo(() => {
    // Caso: todo el tiempo → agrupar por mes
    if (period === 'all') {
      const map = new Map<string, number>();
      ordersWithTime.forEach(o => {
        if (o.status === 'cancelado') return;
        const k = o.createdAt.slice(0, 7); // YYYY-MM
        map.set(k, (map.get(k) ?? 0) + o.total);
      });
      return [...map.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => ({
          dateKey: k,
          label: new Date(k + '-01').toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
          value: v,
        }));
    }

    // ✅ FIX: separar el caso 'custom' del predefinido.
    // Antes, 'custom' caía en el branch predefinido y usaba lastNDayKeys(90)
    // en lugar de las claves del rango seleccionado, resultando en un mapa
    // vacío para el rango custom → sin datos en gráfico ni tabla.
    if (period === 'custom') {
      // dayKeys ya contiene las claves YYYY-MM-DD del rango personalizado
      // generadas correctamente por parseDateStartLocal + formatDateLocal
      const map = new Map<string, number>(dayKeys.map(k => [k, 0]));
      activeOrders.forEach(o => {
        const k = orderDateKey(o.createdAt);
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + o.total);
      });
      return dayKeys.map(k => ({
        dateKey: k,
        label: isoDateLabel(k + 'T12:00:00'),
        value: map.get(k) ?? 0,
      }));
    }

    // Caso: períodos predefinidos (7d, 30d, 90d)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const keys = lastNDayKeys(days);
    const map = new Map<string, number>(keys.map(k => [k, 0]));
    activeOrders.forEach(o => {
      const k = orderDateKey(o.createdAt);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + o.total);
    });
    return keys.map(k => ({
      dateKey: k,
      label: isoDateLabel(k + 'T12:00:00'),
      value: map.get(k) ?? 0,
    }));
  }, [ordersWithTime, activeOrders, period, dayKeys]);

  /* ── Top productos ── */
  const topProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; qty: number; revenue: number }>();
    activeOrders.forEach(o =>
      o.items.forEach(it => {
        const prev = map.get(it.productId) ?? { id: it.productId, name: it.productName, qty: 0, revenue: 0 };
        map.set(it.productId, {
          id: it.productId,
          name: it.productName,
          qty: prev.qty + it.quantity,
          revenue: prev.revenue + it.unitPrice * it.quantity,
        });
      })
    );
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [activeOrders]);

  const maxProductRevenue = topProducts[0]?.revenue ?? 1;

  /* ── Distribución por estado ── */
  const statusSlices = useMemo(() => {
    const map = new Map<string, number>();

    periodOrders.forEach(o => {
      map.set(o.status, (map.get(o.status) ?? 0) + 1);
    });

    const keys = ['pendiente', 'confirmado', 'en-preparacion', 'enviado', 'entregado', 'cancelado'];

    return keys.map(k => ({
      key: k,
      count: map.get(k) ?? 0,
    }));
  }, [periodOrders]);




  // Skeletons memoizados y reutilizables
  const BarChartSkeleton = React.memo(function BarChartSkeleton() {
    return (
      <div className={styles.skeletonChartContainer}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', width: '100%' }}>
          {
            skeletonHeights.map((h, i) => (
              <div key={i} className={styles.skeletonChartBar + ' skeleton'} style={{ height: `${h}%` }}></div>
            ))
          }
        </div>
      </div>
    );
  });

  const DonutChartSkeleton = React.memo(function DonutChartSkeleton() {
    return (
      <div className={styles.donutWrap}>
        <div className={styles.skeletonDonut + ' skeleton'}></div>
        <div className={styles.skeletonLegend}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonLegendItem + ' skeleton'}></div>
          ))}
        </div>
      </div>
    );
  });

  const ProductRankingSkeleton = () => (
    <div className={styles.skeletonProductRanking}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.skeletonProductRankItem}></div>
      ))}
    </div>
  );

  const [skeletonHeights] = useState(() =>
    Array.from({ length: 20 }, () => 30 + Math.random() * 70)
  );

  const paginatedOrders = useMemo(() => {
    return filteredOrdersTable.slice(
      (page - 1) * pageSize,
      page * pageSize
    );
  }, [filteredOrdersTable, page, pageSize]);

  useEffect(() => {
    const maxPage = Math.ceil(filteredOrdersTable.length / pageSize);
    if (page > maxPage) setPage(maxPage || 1);
  }, [filteredOrdersTable, pageSize, page]);

  const salesContent = useMemo(() => {
    if (salesViewMode === 'chart') {
      // ✅ El guard solo aplica al gráfico
      if (barData.every(d => d.value === 0)) {
        return <p className={styles.noData + ' fadeCross'}>Sin ventas en este período.</p>;
      }
      return (
        <Suspense fallback={<BarChartSkeleton aria-busy="true" />}>
          <div className={styles.fadeIn}>
            <BarChart data={barData} formatValue={(n) => formatPriceShort(n)} />
          </div>
        </Suspense>
      );
    }

    // ✅ La tabla siempre renderiza, muestra "Sin ventas" por fila internamente
    return (
      <div className={styles.fadeIn}>
        <SalesTableView
          orders={periodOrders}
          formatPrice={formatPrice}
          dayKeys={dayKeys}
        />
      </div>
    );
  }, [barData, salesViewMode, BarChartSkeleton, dayKeys, periodOrders]);

  const from = filteredOrdersTable.length === 0
    ? 0
    : (page - 1) * pageSize + 1;

  const to = Math.min(page * pageSize, filteredOrdersTable.length);

  return (
    <div className={`${sectionStyles.page} ${styles.reportsPage} dark:bg-gray-900 dark:text-gray-100`} ref={pdfRootRef}>
      {/* Header */}
      <div className={sectionStyles.header}>
        <span className={sectionStyles.label + ' fadeInFast'}>Administración</span>
        <h1 className={styles.panelTitle + ' fadeIn'}>
          <span className={sectionStyles.icon}>📊</span> Reportes y estadísticas
        </h1>
        <p className={sectionStyles.subtitle + ' fadeInFast'}>
          Analizá el rendimiento de tu tienda: ventas, productos más vendidos y evolución del negocio.
        </p>
      </div>

      {/* Modal de confirmación de cambios no guardados */}
      <ConfirmModal
        open={showWarning}
        title="Tienes cambios sin guardar"
        message="¿Seguro que quieres salir? Se perderán los cambios no guardados."
        confirmLabel="Salir y descartar cambios"
        cancelLabel="Cancelar"
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />

      {/* Toolbar: filtro periodo + exportar */}
      <div className={styles.toolbar}>
        <ReportsFilters
          value={filters}
          onChange={setFilters}
          minDate={minDate}
          maxDate={maxDate}
        />
        <div>

          <span className={styles.exportLabel}>Descargar resumen:</span>
          <button
            type="button"
            className={styles.exportResumeBtn}
            style={{ marginLeft: 8 }}
            onClick={async () => {
              setShowHiddenPdf(true);
              // Esperar a que el PrintableReport se monte
              setTimeout(async () => {
                try {
                  await generatePdf({
                    rootRef: hiddenPdfRef,
                    fileName: 'reporte-resumen.pdf',
                  });
                  setNotif({ open: true, type: 'success', message: 'PDF generado y descargado correctamente.' });
                } catch {
                  setNotif({ open: true, type: 'error', message: 'Ocurrió un error al generar el PDF.' });
                } finally {
                  setShowHiddenPdf(false);
                }
              }, 300); // da tiempo a renderizar offscreen
            }}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Generando PDF…' : 'Descargar PDF'}
          </button>
        </div>
        {/* Contenedor invisible para exportación PDF fiel */}
        {showHiddenPdf && (
          <div style={{ position: 'absolute', left: -9999, top: 0, width: 900, pointerEvents: 'none', zIndex: -1 }}>
            <PrintableReport
              ref={hiddenPdfRef}
              filters={filters}
              metrics={metrics}
              barData={barData}
              statusSlices={statusSlices}
              periodLabel={filters.type === 'predefined' ? PERIOD_LABELS[filters.period] : 'Rango personalizado'}
              ordersTableProps={{ orders: filteredOrdersTable }}
              ordersTableFilters={ordersTableFilters}
            />
          </div>
        )}

      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <KPISkeleton key={i} />
          ))}
        </>
      ) : (
        <div className={styles.fadeIn}>
          <ReportsMetrics metrics={metrics} />
        </div>
      )}

      {isLoading ? (
        <>
          <div className={styles.panel + ' fadeIn'}>
            <div className={styles.panelHeader}>
              <div className={styles.skeletonPanelTitle}></div>
              <div className={styles.skeletonPanelSubtitle}></div>
            </div>
            <BarChartSkeleton />
          </div>

          <div className={styles.twoCol + ' fadeIn'}>
            <div className={styles.panel + ' fadeInFast'}>
              <div className={styles.panelHeader}>
                <div className={styles.skeletonPanelTitle}></div>
                <div className={styles.skeletonPanelSubtitle}></div>
              </div>
              <ProductRankingSkeleton />
            </div>

            <div className={styles.panel + ' fadeInFast'}>
              <div className={styles.panelHeader}>
                <div className={styles.skeletonPanelTitle}></div>
                <div className={styles.skeletonPanelSubtitle}></div>
              </div>
              <DonutChartSkeleton />
            </div>
          </div>

          <div className={styles.panel + ' fadeIn'}>
            <div className={styles.panelHeader}>
              <div className={styles.skeletonPanelTitle}></div>
              <div className={styles.skeletonPanelSubtitle}></div>
            </div>
            <div className={styles.skeletonTableSkeleton}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.skeletonTableRow}></div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Gráfica de ventas */}
          <div className={styles.panel + ' fadeIn'}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle + ' fadeInFast'}>📈 Ventas — {filters.type === 'predefined' ? PERIOD_LABELS[filters.period] : 'Rango personalizado'}</h2>
              <span className={styles.panelSubtitle + ' fadeInFast'}>
                {filters.type === 'predefined' && filters.period === 'all' ? 'Agrupado por mes' : 'Agrupado por día'}
                {' · '}ingresos de pedidos activos
              </span>
            </div>
            <div className={styles.viewToggle}>
              <span className={styles.viewToggleLabel}>Vista:</span>

              <button
                className={`${styles.toggleBtn} ${salesViewMode === 'chart' ? styles.active : ''}`}
                onClick={() => setSalesViewMode('chart')}
              >
                📊 Gráfico
              </button>

              <button
                className={`${styles.toggleBtn} ${salesViewMode === 'table' ? styles.active : ''}`}
                onClick={() => setSalesViewMode('table')}
              >
                📋 Tabla
              </button>
            </div>
            {salesContent}
          </div>

          {/* Top productos + Distribución de estados */}
          <div className={styles.twoCol + ' fadeIn'}>
            <div className={styles.panel + ' fadeInFast'}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle + ' fadeInFast'}>🏆 Productos más vendidos</h2>
                <p className={styles.panelSubtitle + ' fadeInFast'}>Por ingresos generados</p>

              </div>
              <div className={styles.viewToggle + ' fadeInFast'}>
                <span className={styles.viewToggleLabel}>Cambiar vista:</span>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  📊 Lista
                </button>

                <button
                  className={`${styles.toggleBtn} ${viewMode === 'cards' ? styles.active : ''}`}
                  onClick={() => setViewMode('cards')}
                >
                  🧾 Cards
                </button>
              </div>
              {topProducts.length === 0 ? (
                <p className={styles.noData + ' fadeCross'}>Sin datos en este período.</p>
              ) : (
                <ProductRanking
                  products={topProducts}
                  maxRevenue={maxProductRevenue}
                  formatPrice={formatPrice}
                  viewMode={viewMode}
                />
              )}
            </div>

            <div className={styles.panel + ' fadeInFast'}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle + ' fadeInFast'}>📦 Por estado de pedido</h2>
                <span className={styles.panelSubtitle + ' fadeInFast'}>Todos los pedidos del período</span>
              </div>
              {periodOrders.length === 0 ? (
                <p className={styles.noData + ' fadeCross'}>Sin datos en este período.</p>
              ) : (
                <Suspense fallback={<DonutChartSkeleton aria-busy="true" />}>
                  <div className={styles.fadeIn}>
                    <DonutChart slices={statusSlices} />
                  </div>
                </Suspense>
              )}
            </div>
          </div>

          {/* Tabla resumen */}
          <div className={styles.panel + ' fadeIn'}>
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderLeft}>
                <h2 className={styles.panelTitle + ' fadeInFast'}>📋 Últimos pedidos del período</h2>
                <span className={styles.panelSubtitle + ' fadeInFast'}>{periodOrders.length} pedidos</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className={styles.exportWrap + ' fadeInFast'}>
                <span>Exportar como:</span>

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
                    onClick={() => setShowExportModal(true)}
                    title={`Exportar pedidos del período como ${exportFormat.toUpperCase()}`}
                    disabled={exportLoading !== null}
                  >
                    ⬇ Exportar
                  </button>
                </div>
              </div>
              <ConfirmModal
                open={showExportModal}
                title="Exportar pedidos"
                message={`¿Deseás exportar los pedidos del período como archivo ${exportFormat.toUpperCase()}?`}
                confirmLabel={exportLoading ? 'Exportando...' : 'Exportar'}
                cancelLabel="Cancelar"
                loading={!!exportLoading}
                onConfirm={async () => {
                  setExportLoading(exportFormat);
                  setShowExportModal(false);
                  const periodLabel =
                    filters.type === 'predefined'
                      ? filters.period
                      : 'custom';
                  const fileName = getExportFileName('pedidos', periodLabel, exportFormat === 'xlsx' ? 'xlsx' : exportFormat);
                  try {
                    if (exportFormat === 'csv') {
                      exportOrdersCSV(periodOrders, fileName);
                    } else if (exportFormat === 'xlsx') {
                      exportOrdersXLSX(periodOrders, fileName);
                    } else if (exportFormat === 'pdf') {
                      await exportOrdersPDF(periodOrders, fileName);
                    }
                    setNotif({ open: true, type: 'success', message: `Exportación exitosa. Archivo ${exportFormat.toUpperCase()} descargado.` });
                  } catch {
                    setNotif({ open: true, type: 'error', message: `Ocurrió un error al exportar (${exportFormat.toUpperCase()}). Por favor, intentá nuevamente.` });
                  } finally {
                    setExportLoading(null);
                  }
                }}
                onCancel={() => setShowExportModal(false)}
              />
              <Notification
                open={notif.open}
                type={notif.type}
                message={notif.message}
                onClose={() => setNotif(n => ({ ...n, open: false }))}
              />
            </div>

            {/* Filtros rápidos para la tabla de pedidos */}
            <div className={styles.advancedFiltersWrap + ' fadeInFast'} style={{ marginBottom: 16 }}>

              <label className={styles.advancedLabel}>
                Cliente
                <input
                  type="text"
                  value={ordersTableFilters.clientQuery}
                  onChange={e => {
                    e.preventDefault();
                    setOrdersTableFilters(f => ({ ...f, clientQuery: e.target.value }))
                  }}
                  placeholder="Nombre o email"
                  className={styles.advancedInput}
                />
              </label>
              <label className={styles.advancedLabel}>
                Producto
                <input
                  type="text"
                  value={ordersTableFilters.productQuery}
                  onChange={e => {
                    e.preventDefault();
                    setOrdersTableFilters(f => ({ ...f, productQuery: e.target.value }))
                  }}
                  placeholder="Nombre de producto"
                  className={styles.advancedInput}
                />
              </label>
              <OrdersFilters
                ordersTableFilters={ordersTableFilters}
                setOrdersTableFilters={setOrdersTableFilters} />
              <div className={styles.advancedActions}>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setOrdersTableFilters({ status: [], clientQuery: '', productQuery: '' })}
                  disabled={
                    !(ordersTableFilters.status.length || ordersTableFilters.clientQuery || ordersTableFilters.productQuery)
                  }
                  title="Limpiar filtros avanzados"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
            {periodOrders.length === 0 ? (
              <p className={styles.noData + ' fadeCross'}>Sin pedidos en este período.</p>
            ) : (
              <>
                <OrdersTable
                  orders={paginatedOrders}
                />
                {filteredOrdersTable.length > pageSize && (
                  <p className={styles.moreHint + ' fadeInFast'}>
                    Mostrando {from}-{to} de {filteredOrdersTable.length} pedidos. Cambiá el tamaño de página o navegá para ver más.
                  </p>
                )}
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={filteredOrdersTable.length}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20, 50, 100]}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

