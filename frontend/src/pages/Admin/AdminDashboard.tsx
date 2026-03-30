import React from "react";
import { useEffect, useState } from "react";
import { useDashboardLayout } from "../../hooks/useDashboardLayout";
import { useDragAndDropWidgets } from "../../hooks/useDragAndDropWidgets";
import { DraggableWidget } from "../../components/ui/DraggableWidget";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import WeeklySalesWidget from "../../components/ui/WeeklySalesWidget";
import CategoryDistributionChart from "../../components/ui/CategoryDistributionChart";
import BarChartTopProducts from "../../components/ui/BarChartTopProducts";
import RecentOrdersWidget from "../../components/ui/RecentOrdersWidget";
import SalesActivityHeatmap from "../../components/ui/SalesActivityHeatmap";
import MonthlyGoalWidget from "../../components/ui/MonthlyGoalWidget";
import { useAdminProducts } from "../../context/AdminProductsContext";
import { useAdminOrders } from "../../context/AdminOrdersContext";
import CriticalStockAlert from "../../components/ui/CriticalStockAlert";
// import DateRangeCard from "../../components/ui/DateRangeCard";
import styles from "./AdminDashboard.module.css";
import type { WeeklySalesData } from "../../components/ui/WeeklySalesWidget";
import MetricCard from "../../components/ui/MetricCard";
import { ActivityFeed } from "../../components/ActivityFeed";
import StaffNotesWidget from "../../components/StaffNotes";

// ── Función de saludo dinámico según la hora del día ──
function getTimeBasedGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return { greeting: "Buenos días", emoji: "🌅" };
  } else if (hour >= 12 && hour < 20) {
    return { greeting: "Buenas tardes", emoji: "☀️" };
  } else {
    return { greeting: "Buenas noches", emoji: "🌙" };
  }
}

const sections = [
  {
    icon: "📦",
    title: "Productos",
    description: "Administrá el catálogo, precios y stock.",
    to: "/admin/productos",
    color: "primary",
  },
  {
    icon: "🛒",
    title: "Pedidos",
    description: "Revisá y gestioná los pedidos recibidos.",
    to: "/admin/pedidos",
    color: "accent",
  },
  {
    icon: "⚠️ Stock",
    title: "Alertas de Stock",
    description: "Monitoreá las ventas sin stock y reabastecé rápido.",
    to: "/admin/alertas-stock",
    color: "warm",
  },
  {
    icon: "📊",
    title: "Reportes",
    description: "Consultá métricas y estadísticas del negocio.",
    to: "/admin/reportes",
    color: "warm",
  },
];

export function AdminDashboard() {
  // Dashboard layout y drag & drop
  const { widgets, reorderWidgets } = useDashboardLayout();
  // Solo widgets habilitados y ordenados
  const enabledWidgets = widgets.filter(w => w.enabled).sort((a, b) => a.order - b.order);
  const enabledWidgetIds = enabledWidgets.map(w => w.id);
  const { dragState, handlers } = useDragAndDropWidgets(enabledWidgetIds, {
    onReorder: reorderWidgets,
  });
  const { orders } = useAdminOrders();
  const { products } = useAdminProducts();
  const [isLoading] = React.useState<boolean>(false);
  const { can } = useAdminAuth();
  const { greeting, emoji } = getTimeBasedGreeting();
  // const [dateRange, setDateRange] = React.useState(() => {
  //   // Por defecto: últimos 7 días
  //   const to = new Date();
  //   const from = new Date();
  //   from.setDate(to.getDate() - 6);
  //   return {
  //     from: from.toISOString().slice(0, 10),
  //     to: to.toISOString().slice(0, 10),
  //   };
  // });

  const [latency, setLatency] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [os, setOs] = useState("Detectando..."); useEffect(() => {
    // 1. Detectar SO (Muy simple)
    const getOS = () => {
      // 1. Intentar con la API moderna (Chrome, Edge, Brave)
      if ("userAgentData" in navigator) {
        const data = navigator.userAgentData as { platform: string } | undefined;
        if (data?.platform) return data.platform;
      }
      // 2. Fallback para Safari, Firefox y navegadores viejos
      return navigator.platform || "Sistema desconocido";
    };

    setOs(getOS());

    // 2. Simular o medir latencia de la BD
    const checkLatency = async () => {
      setIsSyncing(true);
      const start = Date.now();
      try {
        // Aquí harías un fetch real a tu API, ej: await fetch('/api/health')
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulación
        setLatency(Date.now() - start);
      } finally {
        setIsSyncing(false);
      }
    };

    checkLatency();
    const interval = setInterval(checkLatency, 30000); // Check cada 30s
    return () => clearInterval(interval);
  }, []);

  // Filtrado de pedidos por rango de fechas deshabilitado (dateRange eliminado)
  const filteredOrders = orders;

  // --- Métricas ---
  // Comparación de métricas deshabilitada (dateRange eliminado)
  // const prevOrders = [];

  // Ingresos
  const ingresosActual = filteredOrders.reduce((acc, o) => acc + o.total, 0);
  // const ingresosPrevio = 0;
  const ingresosVar = 0;
  // Pedidos
  const pedidosActual = filteredOrders.length;
  // const pedidosPrevio = 0;
  const pedidosVar = 0;
  // Nuevos clientes (emails únicos)
  const clientesActual = Array.from(
    new Set(filteredOrders.map((o) => o.customer.email)),
  ).length;
  // const clientesPrevio = 0;
  const clientesVar = 0;
  // Tasa de conversión (pedidos/clientes)
  const conversionActual =
    clientesActual === 0 ? 0 : (pedidosActual / clientesActual) * 100;
  // const conversionPrevio = 0;
  const conversionVar = 0;

  // --- Gráfico semanal deshabilitado (dateRange eliminado) ---
  const salesData: WeeklySalesData[] = [];
  const totalSales = 0;

  // --- Mapa de calor de ventas deshabilitado (dateRange eliminado) ---
  const weekDays: string[] = [];
  const hourLabels: string[] = [];
  const heatmapData: number[][] = [];

  // --- Distribución por categoría (ventas) ---
  function getCategoryDistribution() {
    // Colores por defecto
    const COLORS = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff8042",
      "#a4de6c",
      "#d0ed57",
      "#8dd1e1",
      "#83a6ed",
      "#ea7e7e",
      "#b47ae7",
    ];
    // Map productId -> category
    const productCategoryMap = products.reduce(
      (acc, p) => {
        acc[p.id] = p.category?.name || "Sin categoría";
        return acc;
      },
      {} as Record<string, string>,
    );
    // Agrupar ventas por categoría
    const categoryTotals: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const cat = productCategoryMap[item.productId] || "Sin categoría";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.quantity;
      });
    });
    // Formatear para el gráfico
    return Object.entries(categoryTotals)
      .map(([category, value], idx) => ({
        category,
        value,
        color: COLORS[idx % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }

  const categoryData = getCategoryDistribution();

  // --- Mejores Clientes (Top 5) ---
  // Agrupar por email (o id si existe), sumar total gastado y contar pedidos
  type ClienteStats = {
    nombre: string;
    email: string;
    pedidos: number;
    totalGastado: number;
  };
  const clientesMap: Record<string, ClienteStats> = {};
  filteredOrders.forEach((order) => {
    const email = order.customer.email;
    if (!clientesMap[email]) {
      clientesMap[email] = {
        nombre:
          `${order.customer.firstName} ${order.customer.lastName}`.trim() ||
          email,
        email,
        pedidos: 0,
        totalGastado: 0,
      };
    }
    clientesMap[email].pedidos += 1;
    clientesMap[email].totalGastado += order.total;
  });
  const mejoresClientes = Object.values(clientesMap)
    .sort((a, b) => b.totalGastado - a.totalGastado)
    .slice(0, 5);

  // --- Top 10 productos más vendidos ---
  // Agrupar ventas por productId
  const productSalesMap: Record<
    string,
    { name: string; sku: string; sales: number }
  > = {};
  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        // Buscar el producto para obtener el SKU
        const prod = products.find((p) => p.id === item.productId);
        productSalesMap[item.productId] = {
          name: item.productName,
          sku: prod?.sku || "",
          sales: 0,
        };
      }
      productSalesMap[item.productId].sales += item.quantity;
    });
  });
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);

  // Skeleton Components
  const ChartSkeleton = () => (
    <div className={styles.chartSkeleton}>
      <div className={styles.skeletonChartBar}></div>
      <div className={styles.skeletonChartBar}></div>
      <div className={styles.skeletonChartBar}></div>
    </div>
  );

  const HeatmapSkeleton = () => (
    <div className={styles.heatmapSkeleton}>
      {Array.from({ length: 168 }).map((_, i) => (
        <div key={i} className={styles.skeletonHeatmapCell}></div>
      ))}
    </div>
  );

  const TopProductsSkeleton = () => (
    <div className={styles.topProductsSkeleton}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.skeletonProductRow}>
          <div className={styles.skeletonProductName}></div>
          <div className={styles.skeletonProductValue}></div>
        </div>
      ))}
    </div>
  );

  const ClientesSkeleton = () => (
    <div className={styles.clientesSkeleton}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.skeletonClienteRow}>
          <div className={styles.skeletonClienteName}></div>
          <div className={styles.skeletonClienteValue}></div>
          <div className={styles.skeletonClienteValue}></div>
        </div>
      ))}
    </div>
  );
  // 1. Definimos la configuración según el estado
  const statusConfig = {
    online: {
      color: "bg-green-500",
      ping: "bg-green-400",
      icon: "✅",
      text: "Online",
    },
    slow: {
      color: "bg-orange-500",
      ping: "bg-orange-400",
      icon: "⚠️",
      text: "Lento",
    },
    offline: {
      color: "bg-red-500",
      ping: "bg-red-400",
      icon: "❌",
      text: "Offline",
    },
  };

  // 2. Elegimos el estado (puedes usar tu lógica de latencia)
  const currentStatus = !navigator.onLine
    ? "offline"
    : latency > 500
      ? "slow"
      : "online";
  const config = statusConfig[currentStatus];

  return (
    <div className={styles.page}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.bannerContent}>
          <h1 className={styles.bannerGreeting}>
            {greeting}, administrador{emoji}
          </h1>
          <p className={styles.bannerSubtext}>
            Continuemos gestionando tu tienda con éxito. Aquí encontrarás todas
            las herramientas que necesitas.
          </p>
        </div>
        <div className={styles.bannerIllustration}>📦</div>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className={styles.label}>Panel de administración</span>
          <h1 className={styles.title}>¡Bienvenido!</h1>
          <p className={styles.subtitle}>
            Accedé rápidamente a todas las secciones del panel.
          </p>
        </div>
        <div className={styles.brandMark}>allmart</div>
      </div>

      {/* Widgets Drag & Drop Dashboard */}
      {enabledWidgets.map((widget) => {
        switch (widget.id) {
          case "quick_access":
            return (
              <DraggableWidget
                key={widget.id}
                id={widget.id}
                isDragging={!!dragState.isDragging}
                isDraggedOver={dragState.dragOverId === widget.id}
                isBeingDragged={dragState.draggedId === widget.id}
                onDragStart={handlers.handleDragStart}
                onDragOver={handlers.handleDragOver}
                onDragLeave={handlers.handleDragLeave}
                onDrop={handlers.handleDrop}
                onDragEnd={handlers.handleDragEnd}
                className={styles.widgetContainer}
              >
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Acceso rápido</h2>
                  <div className={styles.grid}>
                    {sections
                      .filter((sec) => {
                        if (sec.to === "/admin/productos") return can("products.view");
                        if (sec.to === "/admin/pedidos") return can("orders.view");
                        if (sec.to === "/admin/alertas-stock") return can("orders.view");
                        if (sec.to === "/admin/reportes") return can("reports.view");
                        return true;
                      })
                      .map((sec) => (
                        <Link
                          key={sec.to}
                          to={sec.to}
                          className={`${styles.card} ${styles[`card_${sec.color}`]}`}
                        >
                          <span className={styles.cardIcon}>{sec.icon}</span>
                          <div>
                            <h3 className={styles.cardTitle}>{sec.title}</h3>
                            <p className={styles.cardDesc}>{sec.description}</p>
                          </div>
                        </Link>
                      ))}
                  </div>
                </section>
              </DraggableWidget>
            );
          case "activity_feed":
            return (
              <DraggableWidget
                key={widget.id}
                id={widget.id}
                isDragging={!!dragState.isDragging}
                isDraggedOver={dragState.dragOverId === widget.id}
                isBeingDragged={dragState.draggedId === widget.id}
                onDragStart={handlers.handleDragStart}
                onDragOver={handlers.handleDragOver}
                onDragLeave={handlers.handleDragLeave}
                onDrop={handlers.handleDrop}
                onDragEnd={handlers.handleDragEnd}
                className={styles.widgetContainer}
              >
                <ActivityFeed />
              </DraggableWidget>
            );
          case "staff_notes":
            return (
              <DraggableWidget
                key={widget.id}
                id={widget.id}
                isDragging={!!dragState.isDragging}
                isDraggedOver={dragState.dragOverId === widget.id}
                isBeingDragged={dragState.draggedId === widget.id}
                onDragStart={handlers.handleDragStart}
                onDragOver={handlers.handleDragOver}
                onDragLeave={handlers.handleDragLeave}
                onDrop={handlers.handleDrop}
                onDragEnd={handlers.handleDragEnd}
                className={styles.widgetContainer}
              >
                <StaffNotesWidget />
              </DraggableWidget>
            );
          case "critical_stock":
            return (
              <DraggableWidget
                key={widget.id}
                id={widget.id}
                isDragging={!!dragState.isDragging}
                isDraggedOver={dragState.dragOverId === widget.id}
                isBeingDragged={dragState.draggedId === widget.id}
                onDragStart={handlers.handleDragStart}
                onDragOver={handlers.handleDragOver}
                onDragLeave={handlers.handleDragLeave}
                onDrop={handlers.handleDrop}
                onDragEnd={handlers.handleDragEnd}
                className={styles.widgetContainer}
              >
                <CriticalStockAlert
                  products={products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    stock: typeof p.stock === "number" ? p.stock : 0,
                  }))}
                />
              </DraggableWidget>
            );
          case "metrics":
            return (
              <DraggableWidget
                key={widget.id}
                id={widget.id}
                isDragging={!!dragState.isDragging}
                isDraggedOver={dragState.dragOverId === widget.id}
                isBeingDragged={dragState.draggedId === widget.id}
                onDragStart={handlers.handleDragStart}
                onDragOver={handlers.handleDragOver}
                onDragLeave={handlers.handleDragLeave}
                onDrop={handlers.handleDrop}
                onDragEnd={handlers.handleDragEnd}
                className={styles.widgetContainer}
              >
                <section className={styles.metricsSection}>
                  <div className={styles.metricsGrid}>
                    <MetricCard
                      title="Ingresos"
                      icon={<span>💰</span>}
                      value={ingresosActual.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 0,
                      })}
                      variation={ingresosVar}
                    />
                    <MetricCard
                      title="Pedidos"
                      icon={<span>🛒</span>}
                      value={pedidosActual}
                      variation={pedidosVar}
                    />
                    <MetricCard
                      title="Nuevos Clientes"
                      icon={<span>🧑‍💼</span>}
                      value={clientesActual}
                      variation={clientesVar}
                    />
                    <MetricCard
                      title="Tasa de Conversión"
                      icon={<span>📈</span>}
                      value={conversionActual.toFixed(1) + "%"}
                      variation={conversionVar}
                    />
                  </div>
                </section>
              </DraggableWidget>
            );
          case "charts":
            return (
              <DraggableWidget
                key={widget.id}
                id={widget.id}
                isDragging={!!dragState.isDragging}
                isDraggedOver={dragState.dragOverId === widget.id}
                isBeingDragged={dragState.draggedId === widget.id}
                onDragStart={handlers.handleDragStart}
                onDragOver={handlers.handleDragOver}
                onDragLeave={handlers.handleDragLeave}
                onDrop={handlers.handleDrop}
                onDragEnd={handlers.handleDragEnd}
                className={styles.widgetContainer}
              >
                <section className={styles.section}>
                  <div className={styles.chartsGrid}>
                    <div className={styles.chartLeft}>
                      {isLoading ? (
                        <>
                          <ChartSkeleton />
                          <HeatmapSkeleton />
                        </>
                      ) : (
                        <>
                          {can("reports.view") && (
                            <>
                              <WeeklySalesWidget
                                data={salesData}
                                totalSales={totalSales}
                              />
                              <SalesActivityHeatmap
                                data={heatmapData}
                                dayLabels={weekDays}
                                hourLabels={hourLabels}
                              />
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div className={styles.chartRight}>
                      {isLoading ? (
                        <>
                          <ChartSkeleton />
                          <div className={styles.goalAndClientsRow}>
                            <div className={styles.goalCard}>
                              <ChartSkeleton />
                            </div>
                            <div className={styles.metricCard}>
                              <div
                                className={styles.skeletonTitle}
                                style={{ marginBottom: "1rem" }}
                              ></div>
                              <ClientesSkeleton />
                            </div>
                          </div>
                          <TopProductsSkeleton />
                        </>
                      ) : (
                        <>
                          {can("reports.view") && (
                            <>
                              <CategoryDistributionChart data={categoryData} />
                              <div className={styles.goalAndClientsRow}>
                                <div className={styles.goalCard}>
                                  <MonthlyGoalWidget ventasDelMes={ingresosActual} />
                                </div>
                                <div className={styles.metricCard}>
                                  <h3
                                    className={styles.cardTitle}
                                    style={{ marginBottom: "1rem" }}
                                  >
                                    Mejores Clientes
                                  </h3>
                                  <ol
                                    style={{ listStyle: "none", margin: 0, padding: 0 }}
                                  >
                                    <li
                                      style={{
                                        display: "flex",
                                        fontWeight: 600,
                                        color: "#888",
                                        borderBottom: "1px solid #eee",
                                        paddingBottom: 4,
                                        marginBottom: 6,
                                      }}
                                    >
                                      <span style={{ flex: 2 }}>Cliente</span>
                                      <span style={{ flex: 1, textAlign: "center" }}>
                                        Pedidos
                                      </span>
                                      <span style={{ flex: 1, textAlign: "right" }}>
                                        Total
                                      </span>
                                    </li>
                                    {mejoresClientes.map((c, idx) => (
                                      <li
                                        key={c.email}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          padding: "4px 0",
                                          borderBottom:
                                            idx < mejoresClientes.length - 1
                                              ? "1px solid #f0f0f0"
                                              : "none",
                                        }}
                                      >
                                        <span
                                          style={{
                                            flex: 2,
                                            fontWeight: 500,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          {c.nombre}
                                        </span>
                                        <span style={{ flex: 1, textAlign: "center" }}>
                                          {c.pedidos}
                                        </span>
                                        <span
                                          style={{
                                            flex: 1,
                                            textAlign: "right",
                                            fontVariantNumeric: "tabular-nums",
                                          }}
                                        >
                                          {c.totalGastado.toLocaleString("es-AR", {
                                            style: "currency",
                                            currency: "ARS",
                                            minimumFractionDigits: 0,
                                          })}
                                        </span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                              <BarChartTopProducts data={topProducts} />
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </section>
              </DraggableWidget>
            );
          case "recent_orders":
            return (
              <DraggableWidget
                key={widget.id}
                id={widget.id}
                isDragging={!!dragState.isDragging}
                isDraggedOver={dragState.dragOverId === widget.id}
                isBeingDragged={dragState.draggedId === widget.id}
                onDragStart={handlers.handleDragStart}
                onDragOver={handlers.handleDragOver}
                onDragLeave={handlers.handleDragLeave}
                onDrop={handlers.handleDrop}
                onDragEnd={handlers.handleDragEnd}
                className={styles.widgetContainer}
              >
                {can("orders.view") && !isLoading && <RecentOrdersWidget />}
              </DraggableWidget>
            );
          default:
            return null;
        }
      })}

      {/* Status bar */}
      <section className={styles.statusBar}>
        {/* Sistema Operativo Real */}
        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>💻</span>
          <span className={styles.statusText}>{os}</span>
        </div>

        {/* Sesión con Latencia dinámica */}
        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>🔒</span>
          <span className={styles.statusText}>
            Sesión:{" "}
            <span className="font-mono text-xs text-green-600">
              {latency}ms (BD)
            </span>
          </span>
        </div>

        {/* Nuevo Indicador Online/Syncing Animado */}
        <div className={styles.statusItem}>
          <div className="flex items-center gap-2">
            {isSyncing ? (
              // Icono de carga rotando (Syncing)
              <span className="animate-spin text-blue-500 text-sm">🔄</span>
            ) : (
              // Punto de pulso (Online/Lento/Offline)
              <span className="relative flex h-2 w-2">
                {currentStatus !== "offline" && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.ping} opacity-75`}
                  ></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`}
                ></span>
              </span>
            )}

            {/* Mostramos el icono y el texto dinámico según el config */}
            <span className={styles.statusIcon}>
              {isSyncing ? "" : config.icon}
            </span>
            <span className={styles.statusText}>
              {isSyncing ? "Sincronizando..." : config.text}
            </span>
          </div>
        </div>

        {/* Fecha (ya la tienes bien) */}
        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>🕐</span>
          <span className={styles.statusText}>
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </section>
    </div>
  );
}
