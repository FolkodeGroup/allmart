import { useState, useMemo, useRef } from 'react';
import { useMonthlyGoal } from '../../features/admin/goals/hooks/useMonthlyGoal';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminProducts } from '../../context/useAdminProductsContext';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';
import { useDragAndDropWidgets } from '../../hooks/useDragAndDropWidgets';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import { useSystemStatus } from './hooks/useSystemStatus';
import { getAdminGreeting } from '../../utils/date';
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
import RecentOrdersWidget from '../../components/ui/RecentOrdersWidget';
import { MonthlyGoalCard } from '../../components/ui/MonthlyGoalCard';

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
};

const fmtCurrency = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { orders } = useAdminOrders();
  const { products, total: totalProducts } = useAdminProducts();
  const { can } = useAdminAuth();
  const { widgets, reorderWidgets, toggleWidget, resetLayout } = useDashboardLayout();
  const { monthlyGoal, setMonthlyGoal } = useMonthlyGoal();
  const { greeting, emoji } = getAdminGreeting();

  // Métricas y agregaciones centralizadas
  const {
    ingresos, totalPedidos, clientesUnicos, tasaConversion, ticketPromedio,
    pendientes, lowStock, categoryData, topProducts, topClients,
    currentMonthRevenue, weeklySalesData, weeklyTotalSales,
  } = useDashboardMetrics(orders, products);

  // Estado del sistema (latencia / online)
  const { latency, statusLabel, statusColor } = useSystemStatus();

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Orden actual de widgets para drag & drop
  const sortedWidgets = useMemo(
    () => [...widgets].sort((a, b) => a.order - b.order).filter((w) => w.enabled),
    [widgets],
  );
  const widgetOrder = useMemo(() => sortedWidgets.map((w) => w.id), [sortedWidgets]);

  const { dragState, handlers } = useDragAndDropWidgets(widgetOrder, {
    onReorder: reorderWidgets,
  });
  const { draggedId, dragOverId, isDragging } = dragState;

  // ─── Widget renderers ───────────────────────────────────────────────────────

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'metrics':
        return (
          <div className={styles.metricsGrid}>
            <MetricCard title="Ingresos" icon={<span>💰</span>} value={fmtCurrency(ingresos)} variation={0} />
            <MetricCard title="Pedidos" icon={<span>🛒</span>} value={totalPedidos} variation={0} />
            <MetricCard title="Clientes" icon={<span>👥</span>} value={clientesUnicos} variation={0} />
            <MetricCard title="Ticket Promedio" icon={<span>🎫</span>} value={fmtCurrency(ticketPromedio)} variation={0} />
            <MetricCard title="Conversión" icon={<span>📊</span>} value={tasaConversion.toFixed(1) + '%'} variation={0} />
            <MetricCard title="Productos" icon={<span>📦</span>} value={totalProducts || products.length} variation={0} />
          </div>
        );

      case 'critical_stock':
        return (
          <div className={styles.criticalStockContainer}>
            {/* Acordeón de Acciones Requeridas (ancho completo) */}
            {can('orders.view') && (
              <div className={styles.requiredActionsWrapper}>
                <RequiredActionsAccordion />
              </div>
            )}

            {/* Alertas de Stock y Productos (2 columnas) */}
            {can('products.view') && (
              <div className={styles.alertsSplit}>
                <div className={styles.alertsColumn}>
                  <div className={styles.alertCard}>
                    <CriticalStockAlert products={products.map((p) => ({ id: p.id, name: p.name, stock: typeof p.stock === 'number' ? p.stock : 0 }))} />
                  </div>
                </div>
                <div className={styles.alertsColumn}>
                  <div className={styles.alertCard}>
                    <IncompleteProductsWidget />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'charts':
        if (!can('reports.view')) return null;
        return (
          <div className={styles.analyticsLayout}>
            {/* Row 1: Goal + Clients */}
            <div className={styles.analyticsTopRow}>
              <MonthlyGoalCard
                currentMonthRevenue={currentMonthRevenue}
                monthlyGoal={monthlyGoal}
                onSaveGoal={setMonthlyGoal}
                styles={styles}
              />
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
                        <span className={styles.clientTotal}>{fmtCurrency(c.total)}</span>
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
              { icon: '⚙️', title: 'Configuración', desc: 'Ajustes de la tienda', to: '/admin/configuracion', color: 'secondary', ok: true },
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

      case 'staff_notes':
        return <StaffNotes />;

      default:
        return null;
    }
  };

  // ─── Sorted, enabled widgets ────────────────────────────────────────────────

  // (sortedWidgets y widgetOrder ya calculados arriba, junto a useDragAndDropWidgets)

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
        onReorderWidgets={reorderWidgets}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* ── Draggable Widgets ── */}
      <div className={styles.widgetsContainer} data-dashboard-container>
        {sortedWidgets.map((widget) => {
          const content = renderWidget(widget.id);
          if (content === null) return null;

          const isBeingDragged = draggedId === widget.id;
          const isDraggedOver = dragOverId === widget.id;

          return (
            <section
              key={widget.id}
              draggable
              onDragStart={(e) => handlers.handleDragStart(e, widget.id)}
              onDragOver={(e) => handlers.handleDragOver(e, widget.id)}
              onDragLeave={handlers.handleDragLeave}
              onDrop={(e) => handlers.handleDrop(e, widget.id)}
              onDragEnd={handlers.handleDragEnd}
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
