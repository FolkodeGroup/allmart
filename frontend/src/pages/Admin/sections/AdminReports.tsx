import { useMemo, useState } from 'react';
import { useAdminOrders } from '../../../context/AdminOrdersContext';
import type { Order } from '../../../context/AdminOrdersContext';
import sectionStyles from './AdminSection.module.css';
import styles from './AdminReports.module.css';

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
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function orderDateKey(iso: string) {
  return iso.slice(0, 10);
}

/* ── Tipos internos ─────────────────────────────────────────────── */
type Period = '7d' | '30d' | '90d' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
  'all': 'Todo el tiempo',
};

/* ── Gráfica de barras SVG ─────────────────────────────────────── */
function BarChart({ data }: { data: { label: string; value: number; dateKey: string }[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const W = 600;
  const H = 190;
  const padLeft = 60;
  const padBottom = 36;
  const padTop = 16;
  const padRight = 12;
  const chartW = W - padLeft - padRight;
  const chartH = H - padBottom - padTop;

  const barW = Math.max(4, chartW / data.length - (data.length > 30 ? 1 : 3));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ pct: t, val: maxVal * t }));

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
    o.total,
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
  const { orders } = useAdminOrders();
  const [period, setPeriod] = useState<Period>('30d');

  /* ── Ventana de fechas ── */
  const periodOrders = useMemo(() => {
    if (period === 'all') return orders;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = Date.now() - days * 86400000;
    return orders.filter(o => new Date(o.createdAt).getTime() >= cutoff);
  }, [orders, period]);

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

  /* ── Datos para BarChart ── */
  const barData = useMemo(() => {
    if (period === 'all') {
      const map = new Map<string, number>();
      orders.forEach(o => {
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
  }, [orders, activeOrders, period]);

  /* ── Top productos ── */
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    activeOrders.forEach(o =>
      o.items.forEach(it => {
        const prev = map.get(it.productId) ?? { name: it.productName, qty: 0, revenue: 0 };
        map.set(it.productId, {
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
    const keys = ['pendiente', 'confirmado', 'en-preparacion', 'enviado', 'entregado', 'cancelado'];
    return keys.map(k => ({
      key: k,
      count: periodOrders.filter(o => o.status === k).length,
    }));
  }, [periodOrders]);

  /* ── Comparativa período anterior ── */
  const prevPeriodRevenue = useMemo(() => {
    if (period === 'all') return null;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const now = Date.now();
    const prevOrders = orders.filter(o => {
      const t = new Date(o.createdAt).getTime();
      return t >= now - days * 2 * 86400000 && t < now - days * 86400000 && o.status !== 'cancelado';
    });
    return prevOrders.reduce((s, o) => s + o.total, 0);
  }, [orders, period]);

  const revenueChange = prevPeriodRevenue !== null && prevPeriodRevenue > 0
    ? ((kpis.totalRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100
    : null;

  return (
    <div className={`${sectionStyles.page} ${styles.reportsPage}`}>
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
        <div className={styles.periodTabs}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              type="button"
              className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
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
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiIcon}>💰</span>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{formatPrice(kpis.totalRevenue)}</span>
            <span className={styles.kpiLabel}>Ingresos totales</span>
            {revenueChange !== null && (
              <span className={`${styles.kpiChange} ${revenueChange >= 0 ? styles.kpiChangePos : styles.kpiChangeNeg}`}>
                {revenueChange >= 0 ? '▲' : '▼'} {Math.abs(revenueChange).toFixed(1)}% vs período anterior
              </span>
            )}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiIcon}>🛒</span>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{kpis.orderCount}</span>
            <span className={styles.kpiLabel}>Pedidos activos</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiIcon}>🎯</span>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{formatPrice(kpis.avgTicket)}</span>
            <span className={styles.kpiLabel}>Ticket promedio</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiIcon}>✅</span>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{kpis.completionRate}%</span>
            <span className={styles.kpiLabel}>Tasa de entrega</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiIcon}>💬</span>
          <div className={styles.kpiBody}>
            <span className={styles.kpiValue}>{kpis.paid}</span>
            <span className={styles.kpiLabel}>Abonados (WhatsApp)</span>
          </div>
        </div>
      </div>

      {/* Gráfica de ventas */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>📈 Ventas — {PERIOD_LABELS[period]}</h2>
          <span className={styles.panelSubtitle}>
            {period === 'all' ? 'Agrupado por mes' : 'Agrupado por día'}
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
                <li key={p.name} className={styles.productRankItem}>
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
          <div className={styles.summaryTableWrap}>
            <table className={styles.summaryTable}>
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th className={styles.tdRight}>Total</th>
                  <th>Estado</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                {[...periodOrders]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map(o => {
                    const statusLabel =
                      o.status === 'pendiente' ? 'Pendiente'
                      : o.status === 'confirmado' ? 'Confirmado'
                      : o.status === 'en-preparacion' ? 'En preparación'
                      : o.status === 'enviado' ? 'Enviado'
                      : o.status === 'entregado' ? 'Entregado'
                      : 'Cancelado';
                    const stClass = styles[`st_${o.status.replace('-', '_')}`] ?? '';
                    return (
                      <tr key={o.id}>
                        <td className={styles.tblId}>#{o.id.slice(0, 8).toUpperCase()}</td>
                        <td className={styles.tblDate}>
                          {new Date(o.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td>{o.customer.firstName} {o.customer.lastName}</td>
                        <td className={`${styles.tblTotal} ${styles.tdRight}`}>
                          {formatPrice(o.total)}
                        </td>
                        <td>
                          <span className={`${styles.stBadge} ${stClass}`}>{statusLabel}</span>
                        </td>
                        <td>
                          <span className={`${styles.payBadge} ${o.paymentStatus === 'abonado' ? styles.payAbonado : styles.payPending}`}>
                            {o.paymentStatus === 'abonado' ? '✓ Abonado' : '○ Sin abonar'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {periodOrders.length > 10 && (
              <p className={styles.moreHint}>
                Mostrando 10 de {periodOrders.length}. Exportá el CSV para ver todos.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

