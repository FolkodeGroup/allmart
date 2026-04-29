import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminProducts } from '../../context/useAdminProductsContext';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';
import type { WidgetId } from '../../context/DashboardLayoutContext';

// Widgets
import MetricCard from '../../components/ui/MetricCard';
import CriticalStockAlert from '../../components/ui/CriticalStockAlert';
import IncompleteProductsWidget from '../../components/ui/IncompleteProductsWidget';
import RequiredActionsAccordion from '../../components/ui/RequiredActionsAccordion';
import CategoryDistributionChart from '../../components/ui/CategoryDistributionChart';
import BarChartTopProducts from '../../components/ui/BarChartTopProducts';
import { ActivityFeed } from '../../components/ActivityFeed';
import { DashboardWidgetSettings } from '../../components/ui/DashboardWidgetSettings';
import StaffNotes from '../../components/StaffNotes';
import WeeklySalesWidget from '../../components/ui/WeeklySalesWidget';
import type { WeeklySalesData } from '../../components/ui/WeeklySalesWidget';
import SalesActivityHeatmap from '../../components/ui/SalesActivityHeatmap';
import RecentOrdersWidget from '../../components/ui/RecentOrdersWidget';

import styles from './AdminDashboard.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const WIDGET_LABELS: Record<WidgetId, string> = {
  metrics: 'Métricas Clave',
  critical_stock: 'Acciones Requeridas',
  quick_access: 'Acceso Rápido',
  activity_feed: 'Actividad Reciente',
  staff_notes: 'Notas del Equipo',
  charts: 'Analítica',
  recent_orders: 'Pedidos Recientes',
  weekly_sales: 'Ventas Semanales',
  sales_heatmap: 'Mapa de Actividad de Ventas',
};

const CATEGORY_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c',
  '#d0ed57', '#8dd1e1', '#83a6ed', '#ea7e7e', '#b47ae7',
];

function getGreeting(): { greeting: string; emoji: string } {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return { greeting: 'Buenos días', emoji: '🌅' };
  if (h >= 12 && h < 20) return { greeting: 'Buenas tardes', emoji: '☀️' };
  return { greeting: 'Buenas noches', emoji: '🌙' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { orders } = useAdminOrders();
  const { products, total: totalProducts } = useAdminProducts();
  const { can } = useAdminAuth();
  const { widgets, reorderWidgets, toggleWidget, resetLayout } = useDashboardLayout();
  const { greeting, emoji } = getGreeting();

  // Drag state
  const [draggedId, setDraggedId] = useState<WidgetId | null>(null);
  const [dragOverId, setDragOverId] = useState<WidgetId | null>(null);

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // System status
  const [latency, setLatency] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const check = async () => {
      const start = Date.now();
      try { await new Promise((r) => setTimeout(r, 80)); } catch { /* noop */ }
      setLatency(Date.now() - start);
    };
    check();
    const interval = setInterval(check, 30000);

    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  // ─── Computed metrics ───────────────────────────────────────────────────────

  const ingresos = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders]);
  const totalPedidos = orders.length;
  const clientesUnicos = useMemo(
    () => new Set(orders.map((o) => o.customer.email)).size,
    [orders],
  );
  const tasaConversion = clientesUnicos === 0 ? 0 : (totalPedidos / clientesUnicos) * 100;
  const ticketPromedio = totalPedidos === 0 ? 0 : ingresos / totalPedidos;

  const pendientes = useMemo(
    () => orders.filter((o) => o.status === 'pendiente').length,
    [orders],
  );

  const lowStock = useMemo(
    () => products.filter((p) => typeof p.stock === 'number' && p.stock <= 5 && p.stock > 0).length,
    [products],
  );

  const categoryData = useMemo(() => {
    const productCatMap = products.reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = p.category?.name || 'Sin categoría';
      return acc;
    }, {});
    const totals: Record<string, number> = {};
    orders.forEach((o) =>
      o.items.forEach((item) => {
        const cat = productCatMap[item.productId] || 'Sin categoría';
        totals[cat] = (totals[cat] || 0) + item.quantity;
      }),
    );
    return Object.entries(totals)
      .map(([category, value], i) => ({ category, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [orders, products]);

  const topProducts = useMemo(() => {
    const salesMap: Record<string, { name: string; sku: string; sales: number }> = {};
    orders.forEach((o) =>
      o.items.forEach((item) => {
        if (!salesMap[item.productId]) {
          const prod = products.find((p) => p.id === item.productId);
          salesMap[item.productId] = { name: item.productName, sku: prod?.sku || '', sales: 0 };
        }
        salesMap[item.productId].sales += item.quantity;
      }),
    );
    return Object.values(salesMap).sort((a, b) => b.sales - a.sales).slice(0, 10);
  }, [orders, products]);

  const topClients = useMemo(() => {
    const clientMap: Record<string, { name: string; email: string; total: number; orders: number }> = {};
    orders.forEach((o) => {
      const key = o.customer.email;
      if (!clientMap[key]) {
        clientMap[key] = { name: `${o.customer.firstName} ${o.customer.lastName}`, email: key, total: 0, orders: 0 };
      }
      clientMap[key].total += o.total;
      clientMap[key].orders += 1;
    });
    return Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  const MONTHLY_GOAL_KEY = 'allmart_monthly_goal';
  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    const saved = localStorage.getItem(MONTHLY_GOAL_KEY);
    return saved ? Number(saved) : 500000;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const currentMonthRevenue = useMemo(() => {
    const now = new Date();
    return orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, o) => s + o.total, 0);
  }, [orders]);
  const goalProgress = Math.min(100, (currentMonthRevenue / monthlyGoal) * 100);

  // recentOrders: disponible si se necesita mostrar en un widget futuro
  const recentOrdersSorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [orders],
  );
  void recentOrdersSorted; // usado condicionalmente por widgets del dashboard

  // ─── Weekly sales data ──────────────────────────────────────────────────────

  const weeklySalesData = useMemo<WeeklySalesData[]>(() => {
    const now = new Date();
    const days: WeeklySalesData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('es-AR', { weekday: 'short' });
      const count = orders.filter((o) => {
        const od = new Date(o.createdAt);
        return od.toDateString() === d.toDateString();
      }).length;
      days.push({ day: dayStr, sales: count });
    }
    return days;
  }, [orders]);

  const weeklyTotalSales = useMemo(() => weeklySalesData.reduce((s, d) => s + d.sales, 0), [weeklySalesData]);

  // ─── Sales heatmap data ─────────────────────────────────────────────────────

  const heatmapData = useMemo(() => {
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const day = (d.getDay() + 6) % 7; // Monday = 0
      const hour = d.getHours();
      matrix[day][hour]++;
    });
    return { data: matrix, dayLabels, hourLabels };
  }, [orders]);

  // ─── Drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, id: WidgetId) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: WidgetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: WidgetId) => {
      e.preventDefault();
      if (!draggedId || draggedId === targetId) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }
      const sorted = [...widgets].sort((a, b) => a.order - b.order);
      const order = sorted.map((w) => w.id);
      const fromIdx = order.indexOf(draggedId);
      const toIdx = order.indexOf(targetId);
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, draggedId);
      reorderWidgets(order);
      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId, widgets, reorderWidgets],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  // ─── Status helpers ─────────────────────────────────────────────────────────
  const statusLabel = !isOnline ? 'Offline' : latency > 500 ? 'Lento' : 'Online';
  const statusColor = !isOnline ? '#ef4444' : latency > 500 ? '#f59e0b' : '#22c55e';

  // ─── Widget renderers ───────────────────────────────────────────────────────

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'metrics':
        return (
          <div className={styles.metricsGrid}>
            <MetricCard title="Ingresos" icon={<span>💰</span>} value={ingresos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })} variation={0} />
            <MetricCard title="Pedidos" icon={<span>🛒</span>} value={totalPedidos} variation={0} />
            <MetricCard title="Clientes" icon={<span>👥</span>} value={clientesUnicos} variation={0} />
            <MetricCard title="Ticket Promedio" icon={<span>🎫</span>} value={ticketPromedio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })} variation={0} />
            <MetricCard title="Conversión" icon={<span>📊</span>} value={tasaConversion.toFixed(1) + '%'} variation={0} />
            <MetricCard title="Productos" icon={<span>📦</span>} value={totalProducts || products.length} variation={0} />
          </div>
        );

      case 'critical_stock':
        return (
          <div className={styles.alertsSplit}>
            {/* Acordeón de Acciones Requeridas */}
            {can('orders.view') && (
              <div className={styles.alertsColumn}>
                <RequiredActionsAccordion />
              </div>
            )}
            {/* Alertas de Stock y Productos */}
            {can('products.view') && (
              <div className={styles.alertsColumn}>
                <h4 className={styles.alertsColumnTitle}>📦 Stock y Productos</h4>
                <div className={styles.alertsColumnScroll}>
                  <div className={styles.alertCard}>
                    <CriticalStockAlert products={products.map((p) => ({ id: p.id, name: p.name, stock: typeof p.stock === 'number' ? p.stock : 0 }))} />
                  </div>
                  <div className={styles.alertCard}><IncompleteProductsWidget /></div>
                </div>
              </div>
            )}
          </div>
        );

      case 'charts':
        if (!can('reports.view')) return null;
        return (
          <div className={styles.analyticsLayout}>
            {/* Row 1: Goal + Charts */}
            <div className={styles.analyticsTopRow}>
              {/* Monthly Goal */}
              <div className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <h4 className={styles.chartTitle}>Objetivo Mensual</h4>
                  <button
                    className={styles.goalEditBtn}
                    onClick={() => { setGoalInput(String(monthlyGoal)); setEditingGoal(true); }}
                    title="Editar objetivo"
                  >
                    ✏️
                  </button>
                </div>
                {editingGoal ? (
                  <div className={styles.goalEditForm}>
                    <input
                      type="number"
                      className={styles.goalEditInput}
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      min={0}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                    />
                    <button
                      className={styles.goalEditSave}
                      onClick={() => {
                        const val = Math.max(0, Number(goalInput) || 0);
                        setMonthlyGoal(val);
                        localStorage.setItem(MONTHLY_GOAL_KEY, String(val));
                        setEditingGoal(false);
                      }}
                    >
                      Guardar
                    </button>
                    <button
                      className={styles.goalEditCancel}
                      onClick={() => setEditingGoal(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className={styles.goalValue}>
                    {currentMonthRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                    <span className={styles.goalTarget}> / {monthlyGoal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}</span>
                  </div>
                )}
                <div className={styles.goalBarOuter}>
                  <div className={styles.goalBarInner} style={{ width: `${goalProgress}%` }} />
                </div>
                <span className={styles.goalPercent}>{goalProgress.toFixed(1)}% completado</span>
              </div>
              {/* Top Clients */}
              <div className={styles.clientsCard}>
                <h4 className={styles.chartTitle}>Mejores Clientes</h4>
                <div className={styles.clientsList}>
                  {topClients.length === 0 ? (
                    <span className={styles.emptyAnalytics}>Sin datos de clientes</span>
                  ) : (
                    topClients.map((c, i) => (
                      <div key={c.email} className={styles.clientRow}>
                        <span className={styles.clientRank}>#{i + 1}</span>
                        <div className={styles.clientInfo}>
                          <span className={styles.clientName}>{c.name}</span>
                          <span className={styles.clientEmail}>{c.email}</span>
                        </div>
                        <span className={styles.clientTotal}>{c.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}</span>
                        <span className={styles.clientOrders}>{c.orders} pedidos</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {/* Row 2: Category + Top Products charts */}
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h4 className={styles.chartTitle}>Distribución por Categoría</h4>
                <CategoryDistributionChart data={categoryData} />
              </div>
              <div className={styles.chartCard}>
                <h4 className={styles.chartTitle}>Top Productos Vendidos</h4>
                <BarChartTopProducts data={topProducts} />
              </div>
            </div>
          </div>
        );

      case 'activity_feed':
        return <ActivityFeed />;

      case 'quick_access':
        return (
          <div className={styles.quickGrid}>
            {[
              { icon: '📦', title: 'Productos', desc: 'Catálogo, precios y stock', to: '/admin/productos', color: 'primary', ok: can('products.view') },
              { icon: '🛒', title: 'Pedidos', desc: 'Gestionar pedidos recibidos', to: '/admin/pedidos', color: 'accent', ok: can('orders.view') },
              { icon: '📊', title: 'Reportes', desc: 'Métricas y estadísticas', to: '/admin/reportes', color: 'warm', ok: can('reports.view') },
              { icon: '🏷️', title: 'Categorías', desc: 'Organizar catálogo', to: '/admin/categorias', color: 'secondary', ok: can('products.view') },
              { icon: '🎨', title: 'Banners', desc: 'Contenido promocional', to: '/admin/banners', color: 'primary', ok: true },
              { icon: '⚙️', title: 'Configuración', desc: 'Ajustes de la tienda', to: '/admin/settings', color: 'secondary', ok: true },
            ]
              .filter((s) => s.ok)
              .map((s) => (
                <Link key={s.to} to={s.to} className={`${styles.quickCard} ${styles['quick_' + s.color]}`}>
                  <span className={styles.quickIcon}>{s.icon}</span>
                  <div className={styles.quickInfo}>
                    <span className={styles.quickTitle}>{s.title}</span>
                    <span className={styles.quickDesc}>{s.desc}</span>
                  </div>
                </Link>
              ))}
          </div>
        );

      case 'recent_orders':
        if (!can('orders.view')) return null;
        return <RecentOrdersWidget />;

      case 'weekly_sales':
        if (!can('reports.view')) return null;
        return <WeeklySalesWidget data={weeklySalesData} totalSales={weeklyTotalSales} />;

      case 'sales_heatmap':
        if (!can('reports.view')) return null;
        return <SalesActivityHeatmap data={heatmapData.data} dayLabels={heatmapData.dayLabels} hourLabels={heatmapData.hourLabels} />;

      case 'staff_notes':
        return <StaffNotes />;

      default:
        return null;
    }
  };

  // ─── Sorted, enabled widgets ────────────────────────────────────────────────

  const sortedWidgets = useMemo(
    () => [...widgets].sort((a, b) => a.order - b.order).filter((w) => w.enabled),
    [widgets],
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* ── Welcome Banner ── */}
      <header className={styles.banner}>
        <div className={styles.bannerLeft}>
          <h1 className={styles.bannerGreeting}>
            {greeting}, administrador {emoji}
          </h1>
          <p className={styles.bannerSub}>
            Arrastrá los widgets para reorganizar tu panel.
          </p>
          <div className={styles.bannerStats}>
            <div className={styles.bannerStat}>
              <span className={styles.bannerStatValue}>{totalPedidos}</span>
              <span className={styles.bannerStatLabel}>Pedidos</span>
            </div>
            <div className={styles.bannerStatDivider} />
            <div className={styles.bannerStat}>
              <span className={styles.bannerStatValue}>{pendientes}</span>
              <span className={styles.bannerStatLabel}>Pendientes</span>
            </div>
            <div className={styles.bannerStatDivider} />
            <div className={styles.bannerStat}>
              <span className={styles.bannerStatValue}>{totalProducts || products.length}</span>
              <span className={styles.bannerStatLabel}>Productos</span>
            </div>
            <div className={styles.bannerStatDivider} />
            <div className={styles.bannerStat}>
              <span className={styles.bannerStatValue}>{lowStock}</span>
              <span className={styles.bannerStatLabel}>Stock bajo</span>
            </div>
          </div>
        </div>
        <div className={styles.bannerRight}>
          <button
            className={styles.settingsBtn}
            onClick={() => setSettingsOpen(true)}
            aria-label="Personalizar dashboard"
            title="Personalizar widgets"
          >
            ⚙️ Personalizar
          </button>
        </div>
      </header>

      {/* ── Settings Panel ── */}
      <DashboardWidgetSettings
        ref={settingsRef}
        widgets={widgets.map((w) => ({ id: w.id, label: WIDGET_LABELS[w.id], enabled: w.enabled }))}
        onToggleWidget={toggleWidget}
        onResetLayout={resetLayout}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* ── Draggable Widgets ── */}
      <div className={styles.widgetsContainer}>
        {sortedWidgets.map((widget) => {
          const content = renderWidget(widget.id);
          if (content === null) return null;

          const isDragging = draggedId !== null;
          const isBeingDragged = draggedId === widget.id;
          const isDraggedOver = dragOverId === widget.id;

          return (
            <section
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={`${styles.widgetSection} ${isBeingDragged ? styles.widgetDragging : ''} ${isDraggedOver ? styles.widgetDragOver : ''} ${isDragging && !isBeingDragged ? styles.widgetDimmed : ''}`}
              data-widget-id={widget.id}
            >
              <div className={styles.widgetHeader}>
                <div className={styles.dragHandle} title="Arrastrá para reordenar">
                  <span className={styles.dragDots}>⋮⋮</span>
                </div>
                <h3 className={styles.widgetTitle}>{WIDGET_LABELS[widget.id]}</h3>
              </div>
              <div className={styles.widgetBody}>
                {content}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Status Bar ── */}
      <footer className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
          <span className={styles.statusText}>{statusLabel}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusText}>{latency}ms</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusText}>
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </footer>
    </div>
  );
}
