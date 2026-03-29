
import React, { useMemo, useState, useEffect } from 'react';
//import { useAdminOrders } from '../../../context/AdminOrdersContext';
import type { Order } from '../../../context/AdminOrdersContext';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminReports.module.css';
import { ReportsFilters } from './components/ReportsFilters';
import type { ReportsFiltersValue, PredefinedPeriod } from './components/ReportsFilters';
import { ReportsMetrics } from './components/ReportsMetrics';
import { OrdersTable } from './components/OrdersTable';
import { Pagination } from './components/Pagination';
import { Suspense, lazy } from 'react';
import { Notification } from '../../../components/ui/Notification';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { exportOrdersCSV, exportOrdersXLSX, exportOrdersPDF, getExportFileName } from '../../../utils/exportHelpers';
import { generateMockOrders } from './components/DatosMockeados';
import { ProductRanking } from './components/ReportsProductRanking';
import { OrdersFilters } from './components/OrdersFilters';

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
  const today = new Date();
  const keys: string[] = [];

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }

  return keys;
}

function orderDateKey(iso: string) {
  return iso.slice(0, 10);
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
const BarChart = lazy(initBarChart);
const DonutChart = lazy(initDonutChart);
function initBarChart() {
  return import('./components/BarChart').then(m => ({ default: m.BarChart }));
}
function initDonutChart() {
  return import('./components/DonutChart').then(m => ({ default: m.DonutChart }));
}


export interface OrdersTableProps {
  orders: Order[];
}

/* ── Componente principal ─────────────────────────────────────── */
export function AdminReports() {

  //const { orders } = useAdminOrders();
  const orders = generateMockOrders(50);
  const [isLoading] = useState(false);
  const [filters, setFilters] = useState<ReportsFiltersValue>({ type: 'predefined', period: '30d' });
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



  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [pageSize, filters]);

  // Determinar periodo para lógica existente
  const period: Period =
    filters.type === 'predefined' ? filters.period : 'custom';

  // Calcular min/max fechas para inputs
  const allDates = orders.map(o => o.createdAt.slice(0, 10));
  const minDate = allDates.length ? allDates.reduce((a, b) => (a < b ? a : b)) : undefined;
  const maxDate = allDates.length ? allDates.reduce((a, b) => (a > b ? a : b)) : undefined;

  const ordersWithTime = useMemo(() =>
    orders.map(o => ({
      ...o,
      createdAtMs: new Date(o.createdAt).getTime()
    })),
    [orders]);

  // Filtrado extendido
  // periodOrders: solo filtra por período (filtros generales)
  const periodOrders = useMemo(() => {
    let filtered = [] as typeof ordersWithTime;
    if (filters.type === 'predefined') {
      if (filters.period === 'all') {
        filtered = ordersWithTime;
      } else {
        const days = filters.period === '7d' ? 7 : filters.period === '30d' ? 30 : 90;
        const cutoff = now - days * 86400000;
        filtered = ordersWithTime.filter(o => o.createdAtMs >= cutoff);
      }
    } else {
      const { from, to } = filters.range;
      if (!from || !to) return [];
      const fromTime = new Date(from).setHours(0, 0, 0, 0);
      const toTime = new Date(to).setHours(23, 59, 59, 999);
      filtered = ordersWithTime.filter(o => o.createdAtMs >= fromTime && o.createdAtMs <= toTime);
    }
    return filtered;
  }, [ordersWithTime, filters, now]);



  // Filtros avanzados SOLO para la tabla de pedidos
  const filteredOrdersTable = useMemo(() => {
    let filtered = periodOrders;
    // 1. Filtro por estado (multi-select)
    if (ordersTableFilters.status && ordersTableFilters.status.length > 0) {
      filtered = filtered.filter(o => ordersTableFilters.status.includes(o.status));
    }
    // 2. Filtro por cliente (nombre, email)
    if (ordersTableFilters.clientQuery && ordersTableFilters.clientQuery.trim() !== '') {
      const q = ordersTableFilters.clientQuery.trim().toLowerCase();
      filtered = filtered.filter(o => {
        const c = o.customer;
        return (
          (c.firstName && c.firstName.toLowerCase().includes(q)) ||
          (c.lastName && c.lastName.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
        );
      });
    }


    // 3. Filtro por producto (nombre parcial)
    if (ordersTableFilters.productQuery && ordersTableFilters.productQuery.trim() !== '') {
      const pq = ordersTableFilters.productQuery.trim().toLowerCase();
      filtered = filtered.filter(o =>
        o.items && o.items.some(it => it.productName && it.productName.toLowerCase().includes(pq))
      );
    }
    return filtered;
  }, [periodOrders, ordersTableFilters]);

  // Corrige la página si los filtros dejan menos elementos de los que la página actual puede mostrar
  useEffect(() => {
    const totalFiltered = filteredOrdersTable.length;
    const maxPage = Math.max(1, Math.ceil(totalFiltered / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredOrdersTable.length, pageSize, page]);

  const from = filteredOrdersTable.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filteredOrdersTable.length);

  const activeOrders = useMemo(
    () => periodOrders.filter(o => o.status !== 'cancelado'),
    [periodOrders]
  );

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const totalRevenue = activeOrders.reduce((s, o) => s + o.total, 0);
    const orderCount = activeOrders.length;
    const avgTicket = orderCount ? totalRevenue / orderCount : 0;
    const delivered = activeOrders.filter(o => o.status === 'entregado').length;
    const completionRate = orderCount ? Math.round((delivered / orderCount) * 100) : 0;
    const paid = periodOrders.filter(o => o.paymentStatus === 'abonado').length;
    return { totalRevenue, orderCount, avgTicket, completionRate, paid };
  }, [activeOrders, periodOrders]);

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

  /* ── Datos para BarChart ── */
  const barData = useMemo(() => {
    if (period === 'all') {
      const map = new Map<string, number>();
      ordersWithTime.forEach(o => {
        if (o.status === 'cancelado') return;
        const k = o.createdAt.slice(0, 7);
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
  }, [ordersWithTime, activeOrders, period]);

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



  return (
    <div className={`${sectionStyles.page} ${styles.reportsPage} dark:bg-gray-900 dark:text-gray-100`}>
      {/* Header */}
      <div className={sectionStyles.header}>
        <span className={sectionStyles.label}>Administración</span>
        <h1 className={sectionStyles.title}>
          <span className={sectionStyles.icon}>📊</span> Reportes y estadísticas
        </h1>
        <p className={sectionStyles.subtitle}>
          Analizá el rendimiento de tu tienda: ventas, productos más vendidos y evolución del negocio.
        </p>
      </div>

      {/* Toolbar: filtro periodo + exportar */}
      <div className={styles.toolbar}>
        <ReportsFilters
          value={filters}
          onChange={setFilters}
          minDate={minDate}
          maxDate={maxDate}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* KPI Cards */}
      {isLoading ? (
        <div className={styles.metricsGrid}>
          {Array.from({ length: 5 }).map((_, i) => (
            <KPISkeleton key={i} />
          ))}
        </div>
      ) : (
        <ReportsMetrics metrics={metrics} />
      )}

      {isLoading ? (
        <>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.skeletonPanelTitle}></div>
              <div className={styles.skeletonPanelSubtitle}></div>
            </div>
            <BarChartSkeleton />
          </div>

          <div className={styles.twoCol}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div className={styles.skeletonPanelTitle}></div>
                <div className={styles.skeletonPanelSubtitle}></div>
              </div>
              <ProductRankingSkeleton />
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div className={styles.skeletonPanelTitle}></div>
                <div className={styles.skeletonPanelSubtitle}></div>
              </div>
              <DonutChartSkeleton />
            </div>
          </div>

          <div className={styles.panel}>
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
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>📈 Ventas — {filters.type === 'predefined' ? PERIOD_LABELS[filters.period] : 'Rango personalizado'}</h2>
              <span className={styles.panelSubtitle}>
                {filters.type === 'predefined' && filters.period === 'all' ? 'Agrupado por mes' : 'Agrupado por día'}
                {' · '}ingresos de pedidos activos
              </span>
            </div>
            {barData.every(d => d.value === 0) ? (
              <p className={styles.noData}>Sin ventas en este período.</p>
            ) : (
              <Suspense fallback={<BarChartSkeleton aria-busy="true" />}>
                <div className={styles.fadeIn}>
                  <BarChart data={barData} formatValue={(n) => formatPriceShort(n)} />
                </div>
              </Suspense>
            )}
          </div>

          {/* Top productos + Distribución de estados */}
          <div className={styles.twoCol}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>🏆 Productos más vendidos</h2>
                <p className={styles.panelSubtitle}>Por ingresos generados</p>

              </div>
              <div className={styles.viewToggle}>
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
                <p className={styles.noData}>Sin datos en este período.</p>
              ) : (
                <ProductRanking
                  products={topProducts}
                  maxRevenue={maxProductRevenue}
                  formatPrice={formatPrice}
                  viewMode={viewMode}
                />
              )}
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>📦 Por estado de pedido</h2>
                <span className={styles.panelSubtitle}>Todos los pedidos del período</span>
              </div>
              {periodOrders.length === 0 ? (
                <p className={styles.noData}>Sin datos en este período.</p>
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
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>📋 Últimos pedidos del período</h2>
              <span className={styles.panelSubtitle}>{periodOrders.length} pedidos</span>
            </div>
            {/* Filtros rápidos para la tabla de pedidos */}
            <div className={styles.advancedFiltersWrap} style={{ marginBottom: 16 }}>

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
              <p className={styles.noData}>Sin pedidos en este período.</p>
            ) : (
              <>
                <OrdersTable
                  orders={paginatedOrders}
                />
                {periodOrders.length > pageSize && (
                  <p className={styles.moreHint}>
                    Mostrando {from}-{to} de {periodOrders.length} pedidos. Cambiá el tamaño de página o navegá para ver más.
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

