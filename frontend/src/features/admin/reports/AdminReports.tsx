import { useMemo, useState, useEffect } from 'react';
import { useAdminOrders } from '../../../context/AdminOrdersContext';
import type { Order } from '../../../context/AdminOrdersContext';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminReports.module.css';
import { ReportsFilters } from './components/ReportsFilters';
import type { ReportsFiltersValue, PredefinedPeriod } from './components/ReportsFilters';
import { ReportsMetrics } from './components/ReportsMetrics';
import { OrdersTable } from './components/OrdersTable';
import { Pagination } from './components/Pagination';
import { generateMockOrders } from './components/DatosMockeados';
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

/* ── Gráfica de barras SVG ─────────────────────────────────────── */
function BarChart({ data }: { data: { label: string; value: number; dateKey: string }[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { maxVal, yTicks } = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
      pct: t,
      val: maxVal * t
    }));
    return { maxVal, yTicks };
  }, [data]);
  const W = 600;
  const H = 190;
  const padLeft = 60;
  const padBottom = 36;
  const padTop = 16;
  const padRight = 12;
  const chartW = W - padLeft - padRight;
  const chartH = H - padBottom - padTop;

  const barW = Math.max(4, chartW / data.length - (data.length > 30 ? 1 : 3));

  if (!data.length) return null;

  return (
    <div className={styles.chartWrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.barChartSvg}
        role="img"
        aria-label="Gráfica de ventas por día"
      >
        {/* Grid lines + Y labels */}
        {yTicks.map(t => {
          const y = padTop + chartH - t.pct * chartH;
          return (
            <g key={t.pct}>
              <line x1={padLeft} x2={W - padRight} y1={y} y2={y}
                stroke="#E5E2DD" strokeWidth={t.pct === 0 ? 1.5 : 1} />
              <text x={padLeft - 6} y={y + 4} textAnchor="end"
                fontSize={9} fill="#767676" fontFamily="Montserrat, sans-serif">
                {formatPriceShort(t.val)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * chartH;
          const x = padLeft + i * (chartW / data.length) + (chartW / data.length - barW) / 2;
          const y = padTop + chartH - barH;
          const isHovered = hoveredIdx === i;
          const hasValue = d.value > 0;

          const showLabel = data.length <= 15
            ? true
            : data.length <= 31
              ? i % 5 === 0 || i === data.length - 1
              : i % 15 === 0 || i === data.length - 1;

          return (
            <g key={d.dateKey}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: hasValue ? 'pointer' : 'default' }}
            >
              <rect
                x={x} y={hasValue ? y : padTop + chartH - 2}
                width={barW}
                height={hasValue ? Math.max(barH, 2) : 2}
                rx={data.length <= 31 ? 4 : 2}
                fill={isHovered ? '#5d7568' : hasValue ? '#769282' : '#F2EFEB'}
                style={{ transition: 'fill 0.15s' }}
              />
              {showLabel && (
                <text
                  x={x + barW / 2} y={H - 8}
                  textAnchor="middle"
                  fontSize={data.length > 30 ? 7 : 9}
                  fill="#767676"
                  fontFamily="Montserrat, sans-serif"
                >
                  {d.label}
                </text>
              )}
              {isHovered && hasValue && (
                <>
                  <rect
                    x={Math.min(x + barW / 2 - 44, W - 90)}
                    y={y - 32} width={88} height={24}
                    rx={5} fill="#1A1A1A" opacity={0.88}
                  />
                  <text
                    x={Math.min(x + barW / 2, W - 45)} y={y - 15}
                    textAnchor="middle"
                    fontSize={9.5} fill="#fff"
                    fontFamily="Montserrat, sans-serif" fontWeight="600"
                  >
                    {formatPrice(d.value)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Gráfica de dona SVG ───────────────────────────────────────── */
const DONUT_COLORS: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmado: '#3b82f6',
  'en-preparacion': '#8b5cf6',
  enviado: '#769282',
  entregado: '#22c55e',
  cancelado: '#ef4444',
};

const DONUT_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  'en-preparacion': 'En preparación',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

function DonutChart({ slices }: { slices: { key: string; count: number }[] }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  const R = 56;
  const r = 36;
  const cx = 80;
  const cy = 80;
  let cumAngle = -Math.PI / 2;

  if (total === 0) {
    return <p className={styles.noData}>Sin datos</p>;
  }

  interface Arc { key: string; count: number; d: string; color: string }
  const arcs: Arc[] = slices
    .filter(s => s.count > 0)
    .map(s => {
      const angle = (s.count / total) * 2 * Math.PI;
      const x1o = cx + R * Math.cos(cumAngle);
      const y1o = cy + R * Math.sin(cumAngle);
      const x2o = cx + R * Math.cos(cumAngle + angle);
      const y2o = cy + R * Math.sin(cumAngle + angle);
      const x1i = cx + r * Math.cos(cumAngle + angle);
      const y1i = cy + r * Math.sin(cumAngle + angle);
      const x2i = cx + r * Math.cos(cumAngle);
      const y2i = cy + r * Math.sin(cumAngle);
      const large = angle > Math.PI ? 1 : 0;
      const d = `M${x1o},${y1o} A${R},${R} 0 ${large},1 ${x2o},${y2o} L${x1i},${y1i} A${r},${r} 0 ${large},0 ${x2i},${y2i} Z`;
      cumAngle += angle;
      return { key: s.key, count: s.count, d, color: DONUT_COLORS[s.key] ?? '#AEA491' };
    });

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 160 160" className={styles.donutSvg} aria-label="Distribución de pedidos por estado">
        {arcs.map(arc => (
          <path key={arc.key} d={arc.d} fill={arc.color} stroke="#fff" strokeWidth={2.5}>
            <title>{DONUT_LABELS[arc.key]}: {arc.count}</title>
          </path>
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize={18} fontWeight="700"
          fill="#1A1A1A" fontFamily="Montserrat, sans-serif">{total}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize={9} fill="#767676"
          fontFamily="Montserrat, sans-serif">pedidos</text>
      </svg>
      <ul className={styles.donutLegend}>
        {arcs.map(arc => (
          <li key={arc.key} className={styles.donutLegendItem}>
            <span className={styles.donutLegendDot} style={{ background: arc.color }} />
            <span className={styles.donutLegendLabel}>{DONUT_LABELS[arc.key]}</span>
            <span className={styles.donutLegendCount}>{arc.count}</span>
            <span className={styles.donutLegendPct}>
              ({Math.round((arc.count / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Exportar CSV ──────────────────────────────────────────────── */
function exportOrdersCSV(orders: Order[]) {
  const headers = ['ID', 'Fecha', 'Cliente', 'Email', 'Productos', 'Total', 'Estado', 'Pago'];
  const rows = orders.map(o => [
    o.id,
    new Date(o.createdAt).toLocaleDateString('es-AR'),
    `${o.customer.firstName} ${o.customer.lastName}`,
    o.customer.email,
    o.items.map(i => `${i.productName} x${i.quantity}`).join(' | '),
    o.total.toString().replace('.', ','),
    o.status,
    o.paymentStatus ?? 'no-abonado',
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `allmart-pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Componente principal ─────────────────────────────────────── */
export function AdminReports() {
  //const { orders } = useAdminOrders();
  const orders = generateMockOrders(50);
  const [isLoading] = useState(false);
  const [filters, setFilters] = useState<ReportsFiltersValue>({ type: 'predefined', period: '30d' });
  const [now, setNow] = useState(() => Date.now());
  // Estado de paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [filters]);

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
  const periodOrders = useMemo(() => {
    if (filters.type === 'predefined') {
      if (filters.period === 'all') return ordersWithTime;

      const days = filters.period === '7d' ? 7 : filters.period === '30d' ? 30 : 90;
      const cutoff = now - days * 86400000;

      return ordersWithTime.filter(o => o.createdAtMs >= cutoff);
    } else {
      const { from, to } = filters.range;
      if (!from || !to) return [];

      const fromTime = new Date(from).setHours(0, 0, 0, 0);
      const toTime = new Date(to).setHours(23, 59, 59, 999);

      return ordersWithTime.filter(o =>
        o.createdAtMs >= fromTime && o.createdAtMs <= toTime
      );
    }
  }, [ordersWithTime, filters, now]);

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



  const BarChartSkeleton = () => (
    <div className={styles.skeletonChartContainer}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', width: '100%' }}>
        {
          skeletonHeights.map((h, i) => (
            <div key={i} className={styles.skeletonChartBar} style={{ height: `${h}%` }}></div>
          ))
        }
      </div>
    </div>
  );

  const DonutChartSkeleton = () => (
    <div className={styles.donutWrap}>
      <div className={styles.skeletonDonut}></div>
      <div className={styles.skeletonLegend}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeletonLegendItem}></div>
        ))}
      </div>
    </div>
  );

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

  const paginatedOrders = periodOrders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

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
        <button
          type="button"
          className={styles.exportBtn}
          onClick={() => exportOrdersCSV(periodOrders)}
          title="Exportar pedidos del período como CSV"
        >
          ⬇ Exportar CSV
        </button>
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
              <BarChart data={barData} />
            )}
          </div>

          {/* Top productos + Distribución de estados */}
          <div className={styles.twoCol}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>🏆 Productos más vendidos</h2>
                <span className={styles.panelSubtitle}>Por ingresos generados</span>
              </div>
              {topProducts.length === 0 ? (
                <p className={styles.noData}>Sin datos en este período.</p>
              ) : (
                <ol className={styles.productRanking}>
                  {topProducts.map((p, i) => (
                    <li key={p.id} className={styles.productRankItem}>
                      <div className={styles.productRankMeta}>
                        <span className={styles.productRankPos}>{i + 1}</span>
                        <div className={styles.productRankInfo}>
                          <span className={styles.productRankName}>{p.name}</span>
                          <div className={styles.productRankStats}>
                            <span className={styles.productRankQty}>{p.qty} und.</span>
                            <span className={styles.productRankRevenue}>{formatPrice(p.revenue)}</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.productBarWrap}>
                        <div
                          className={`${styles.productBar} ${i === 0 ? styles.productBarTop : ''}`}
                          style={{ width: `${Math.max((p.revenue / maxProductRevenue) * 100, 4)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
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
                <DonutChart slices={statusSlices} />
              )}
            </div>
          </div>

          {/* Tabla resumen */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>📋 Últimos pedidos del período</h2>
              <span className={styles.panelSubtitle}>{periodOrders.length} pedidos</span>
            </div>
            {periodOrders.length === 0 ? (
              <p className={styles.noData}>Sin pedidos en este período.</p>
            ) : (
              <>

                <OrdersTable
                  orders={
                    paginatedOrders
                  }
                  page={page}
                  pageSize={pageSize}
                  total={periodOrders.length}
                />
                {periodOrders.length > pageSize && (
                  <p className={styles.moreHint}>
                    Mostrando {Math.min(pageSize, periodOrders.length - (page - 1) * pageSize)} de {periodOrders.length}.
                  </p>
                )}
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={periodOrders.length}
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

