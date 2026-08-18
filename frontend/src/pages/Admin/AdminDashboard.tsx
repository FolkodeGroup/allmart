import { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
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
import { ActivityFeed } from '../../components/ActivityFeed';
import { DashboardWidgetSettings } from '../../components/ui/DashboardWidgetSettings';
import StaffNotes from '../../components/StaffNotes';
import WeeklySalesWidget from '../../components/ui/WeeklySalesWidget';
import RecentOrdersWidget from '../../components/ui/RecentOrdersWidget';
import { MonthlyGoalCard } from '../../components/ui/MonthlyGoalCard';
import { MobileDashboardTabs, type DashboardMobileTab } from '../../components/ui/MobileDashboardTabs';
import { MobileCollapsibleBlock } from '../../components/ui/MobileCollapsibleBlock';

import styles from './AdminDashboard.module.css';

// 🟢 Carga Diferida (Lazy Loading) de Gráficos Recharts
const CategoryDistributionChart = lazy(() => import('../../components/ui/CategoryDistributionChart'));
const BarChartTopProducts = lazy(() => import('../../components/ui/BarChartTopProducts'));

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

const MOBILE_TABS_ORDER: DashboardMobileTab[] = ['resumen', 'pedidos', 'alertas', 'analitica'];

const fmtCurrency = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { orders } = useAdminOrders();
  const { products, total: totalProducts } = useAdminProducts();
  const { can } = useAdminAuth();
  const { widgets, reorderWidgets, toggleWidget, resetLayout } = useDashboardLayout();
  const { monthlyGoal, setMonthlyGoal } = useMonthlyGoal();
  const { greeting } = getAdminGreeting();

  // Detección responsive de vista móvil (< 768px)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [mobileTab, setMobileTab] = useState<DashboardMobileTab>('resumen');

  // Gestos táctiles de deslizamiento (Swipe left / right)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Métricas y agregaciones centralizadas
  const {
    ingresos, totalPedidos, clientesUnicos, tasaConversion, ticketPromedio,
    pendientes, lowStock, categoryData, topProducts, topClients,
    currentMonthRevenue, weeklySalesData, weeklyTotalSales, variaciones,
  } = useDashboardMetrics(orders, products);

  // Estado del sistema (latencia / online)
  const { latency, statusLabel, statusColor } = useSystemStatus();

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Orden actual de widgets para drag & drop (Escritorio)
  const sortedWidgets = useMemo(
    () => [...widgets].sort((a, b) => a.order - b.order).filter((w) => w.enabled),
    [widgets],
  );
  const widgetOrder = useMemo(() => sortedWidgets.map((w) => w.id), [sortedWidgets]);

  const { dragState, handlers } = useDragAndDropWidgets(widgetOrder, {
    onReorder: reorderWidgets,
  });
  const { draggedId, dragOverId, isDragging } = dragState;

  // Handlers para Swipe táctil
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > deltaY) {
      const currentIndex = MOBILE_TABS_ORDER.indexOf(mobileTab);

      if (deltaX < 0 && currentIndex < MOBILE_TABS_ORDER.length - 1) {
        setMobileTab(MOBILE_TABS_ORDER[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        setMobileTab(MOBILE_TABS_ORDER[currentIndex - 1]);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // ─── Widget renderers para Escritorio ────────────────────────────────────────

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'metrics':
        return (
          <div className={styles.metricsGrid}>
            <MetricCard title="Ingresos" value={fmtCurrency(ingresos)} variation={variaciones.ingresos} />
            <MetricCard title="Pedidos" value={totalPedidos} variation={variaciones.pedidos} />
            <MetricCard title="Clientes" value={clientesUnicos} variation={variaciones.clientes} />
            <MetricCard title="Ticket Promedio" value={fmtCurrency(ticketPromedio)} variation={variaciones.ticketPromedio} />
            <MetricCard title="Conversión" value={tasaConversion.toFixed(1) + '%'} variation={variaciones.conversion} />
            <MetricCard title="Productos" value={totalProducts || products.length} variation={0} />
          </div>
        );

      case 'critical_stock':
        return (
          <div className={styles.criticalStockContainer}>
            {can('orders.view') && (
              <div className={styles.requiredActionsWrapper}>
                <RequiredActionsAccordion />
              </div>
            )}
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
            <div className={styles.analyticsTopRow}>
              <MonthlyGoalCard
                currentMonthRevenue={currentMonthRevenue}
                monthlyGoal={monthlyGoal}
                onSaveGoal={setMonthlyGoal}
                styles={styles}
              />
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
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <Suspense fallback={<div className={styles.skeletonChartPlaceholder} />}>
                  <CategoryDistributionChart data={categoryData} />
                </Suspense>
              </div>
              <div className={styles.chartCard}>
                <Suspense fallback={<div className={styles.skeletonChartPlaceholder} />}>
                  <BarChartTopProducts data={topProducts} />
                </Suspense>
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
              { icon: 'bi bi-box-seam', title: 'Productos', desc: 'Catálogo, precios y stock', to: '/admin/productos', color: 'primary', ok: can('products.view') },
              { icon: 'bi bi-cart3', title: 'Pedidos', desc: 'Gestionar pedidos recibidos', to: '/admin/pedidos', color: 'accent', ok: can('orders.view') },
              { icon: 'bi bi-bar-chart-line', title: 'Reportes', desc: 'Métricas y estadísticas', to: '/admin/reportes', color: 'warm', ok: can('reports.view') },
              { icon: 'bi bi-tags', title: 'Categorías', desc: 'Organizar catálogo', to: '/admin/categorias', color: 'secondary', ok: can('products.view') },
              { icon: 'bi bi-image', title: 'Banners', desc: 'Contenido promocional', to: '/admin/banners', color: 'primary', ok: true },
              { icon: 'bi bi-gear', title: 'Configuración', desc: 'Ajustes de la tienda', to: '/admin/configuracion', color: 'secondary', ok: true },
            ]
              .filter((s) => s.ok)
              .map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className={`${styles.quickCard} ${styles[s.color]}`}
                >
                  <span className={styles.quickIcon}>
                    <i className={s.icon}></i>
                  </span>
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

  // ─── RENDERIZADO VISTA MÓVIL (< 768px) CON DESPLEGABLES Y SWIPE ──────────────

  if (isMobile) {
    const currentTabIndex = MOBILE_TABS_ORDER.indexOf(mobileTab);

    return (
      <div className={styles.page}>
        {/* Banner de Bienvenida Mapeado */}
        <header className={styles.mobileBanner}>
          <div className={styles.mobileBannerTop}>
            <div>
              <h1 className={styles.mobileGreeting}>{greeting}, admin</h1>
              <p className={styles.mobileSub}>Resumen táctico de tienda</p>
            </div>
            <button
              className={styles.settingsBtnMobile}
              onClick={() => setSettingsOpen(true)}
              aria-label="Personalizar dashboard"
              type="button"
            >
              ⚙️
            </button>
          </div>
        </header>

        {/* Botonera de Pestañas Fluyendo Naturalmente */}
        <MobileDashboardTabs
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          pendingOrdersCount={pendientes}
          lowStockCount={lowStock}
        />

        {/* Indicador de Deslizamiento Táctil */}
        <div className={styles.swipeHintBar}>
          {currentTabIndex > 0 ? '‹ ' : ''}
          Deslizá para cambiar de pestaña
          {currentTabIndex < MOBILE_TABS_ORDER.length - 1 ? ' ›' : ''}
        </div>

        <DashboardWidgetSettings
          ref={settingsRef}
          widgets={widgets.map((w) => ({ id: w.id, label: WIDGET_LABELS[w.id], enabled: w.enabled }))}
          onToggleWidget={toggleWidget}
          onResetLayout={resetLayout}
          onReorderWidgets={reorderWidgets}
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        {/* Panel Contenedor con IDs vinculados a aria-controls */}
        <div
          className={styles.mobileTabPanel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mobileTab === 'resumen' && (
            <div id="panel-resumen" role="tabpanel" aria-labelledby="tab-resumen" className={styles.mobileSectionStack}>
              {/* Grilla KPI 2x2 Fija */}
              <section className={styles.mobileKpiGrid}>
                <MetricCard title="Ingresos" value={fmtCurrency(ingresos)} variation={variaciones.ingresos} />
                <MetricCard title="Pedidos" value={totalPedidos} variation={variaciones.pedidos} />
                <MetricCard title="Clientes" value={clientesUnicos} variation={variaciones.clientes} />
                <MetricCard title="Ticket Prom." value={fmtCurrency(ticketPromedio)} variation={variaciones.ticketPromedio} />
              </section>

              {/* Acceso Rápido en Desplegable */}
              <MobileCollapsibleBlock
                title="Acceso Rápido"
                icon={<i className="bi bi-compass" />}
                defaultExpanded={true}
              >
                <div className={styles.quickGridMobile}>
                  {[
                    { icon: 'bi bi-box-seam', title: 'Productos', to: '/admin/productos', color: 'primary', ok: can('products.view') },
                    { icon: 'bi bi-cart3', title: 'Pedidos', to: '/admin/pedidos', color: 'accent', ok: can('orders.view') },
                    { icon: 'bi bi-bar-chart-line', title: 'Reportes', to: '/admin/reportes', color: 'warm', ok: can('reports.view') },
                    { icon: 'bi bi-tags', title: 'Categorías', to: '/admin/categorias', color: 'secondary', ok: can('products.view') },
                    { icon: 'bi bi-image', title: 'Banners', to: '/admin/banners', color: 'primary', ok: true },
                    { icon: 'bi bi-gear', title: 'Ajustes', to: '/admin/configuracion', color: 'secondary', ok: true },
                  ]
                    .filter((s) => s.ok)
                    .map((s) => (
                      <Link key={s.to} to={s.to} className={`${styles.quickCardMobile} ${styles[s.color]}`}>
                        <span className={styles.quickIconMobile}>
                          <i className={s.icon}></i>
                        </span>
                        <span className={styles.quickTitleMobile}>{s.title}</span>
                      </Link>
                    ))}
                </div>
              </MobileCollapsibleBlock>

              {/* Ventas Semanales en Desplegable */}
              {can('reports.view') && (
                <MobileCollapsibleBlock
                  title="Ventas Semanales"
                  icon={<i className="bi bi-graph-up-arrow" />}
                  defaultExpanded={true}
                >
                  <WeeklySalesWidget data={weeklySalesData} totalSales={weeklyTotalSales} />
                </MobileCollapsibleBlock>
              )}
            </div>
          )}

          {mobileTab === 'pedidos' && (
            <div id="panel-pedidos" role="tabpanel" aria-labelledby="tab-pedidos" className={styles.mobileSectionStack}>
              {can('orders.view') && <RequiredActionsAccordion />}
              {can('orders.view') && <RecentOrdersWidget />}
            </div>
          )}

          {mobileTab === 'alertas' && (
            <div id="panel-alertas" role="tabpanel" aria-labelledby="tab-alertas" className={styles.mobileSectionStack}>
              {can('products.view') && (
                <CriticalStockAlert products={products.map((p) => ({ id: p.id, name: p.name, stock: typeof p.stock === 'number' ? p.stock : 0 }))} />
              )}
              {can('products.view') && <IncompleteProductsWidget />}
            </div>
          )}

          {mobileTab === 'analitica' && (
            <div id="panel-analitica" role="tabpanel" aria-labelledby="tab-analitica" className={styles.mobileSectionStack}>
              {/* Objetivo Mensual en Desplegable */}
              <MobileCollapsibleBlock
                title="Objetivo Mensual"
                icon={<i className="bi bi-bullseye" />}
                defaultExpanded={true}
              >
                <MonthlyGoalCard
                  currentMonthRevenue={currentMonthRevenue}
                  monthlyGoal={monthlyGoal}
                  onSaveGoal={setMonthlyGoal}
                  styles={styles}
                />
              </MobileCollapsibleBlock>

              {/* Distribución por Categoría en Desplegable */}
              {can('reports.view') && (
                <MobileCollapsibleBlock
                  title="Distribución por Categoría"
                  icon={<i className="bi bi-pie-chart" />}
                  defaultExpanded={true}
                >
                  <Suspense fallback={<div className={styles.skeletonChartPlaceholder} />}>
                    <CategoryDistributionChart data={categoryData} />
                  </Suspense>
                </MobileCollapsibleBlock>
              )}

              {/* Top Productos en Desplegable */}
              {can('reports.view') && (
                <MobileCollapsibleBlock
                  title="Top Productos Vendidos"
                  icon={<i className="bi bi-trophy" />}
                  defaultExpanded={false}
                >
                  <Suspense fallback={<div className={styles.skeletonChartPlaceholder} />}>
                    <BarChartTopProducts data={topProducts} />
                  </Suspense>
                </MobileCollapsibleBlock>
              )}

              {/* Actividad Reciente en Desplegable */}
              <MobileCollapsibleBlock
                title="Actividad Reciente"
                icon={<i className="bi bi-activity" />}
                defaultExpanded={false}
              >
                <ActivityFeed />
              </MobileCollapsibleBlock>

              {/* Notas del Equipo en Desplegable */}
              <MobileCollapsibleBlock
                title="Notas del Equipo"
                icon={<i className="bi bi-journal-text" />}
                defaultExpanded={false}
              >
                <StaffNotes />
              </MobileCollapsibleBlock>
            </div>
          )}
        </div>

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
              {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // ─── RENDERIZADO VISTA ESCRITORIO (>= 768px) INTACTA ────────────────────────

  return (
    <div className={styles.page}>
      <header className={styles.banner}>
        <div className={styles.bannerLeft}>
          <h1 className={styles.bannerGreeting}>
            {greeting}, administrador
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
            type="button"
          >
            ⚙️ Personalizar
          </button>
        </div>
      </header>

      <DashboardWidgetSettings
        ref={settingsRef}
        widgets={widgets.map((w) => ({ id: w.id, label: WIDGET_LABELS[w.id], enabled: w.enabled }))}
        onToggleWidget={toggleWidget}
        onResetLayout={resetLayout}
        onReorderWidgets={reorderWidgets}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

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