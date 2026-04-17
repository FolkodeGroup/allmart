import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminProducts } from "../../context/useAdminProductsContext";
import { useAdminOrders } from "../../context/AdminOrdersContext";

// UI Components
import MetricCard from "../../components/ui/MetricCard";
import CriticalStockAlert from "../../components/ui/CriticalStockAlert";
import PendingOrdersAlert from "../../components/ui/PendingOrdersAlert";
import PaymentAlertsWidget from "../../components/ui/PaymentAlertsWidget";
import IncompleteProductsWidget from "../../components/ui/IncompleteProductsWidget";
import ShippingAlertsWidget from "../../components/ui/ShippingAlertsWidget";
import CategoryDistributionChart from "../../components/ui/CategoryDistributionChart";
import BarChartTopProducts from "../../components/ui/BarChartTopProducts";
import { ActivityFeed } from "../../components/ActivityFeed";

import styles from "./AdminDashboard.module.css";

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

export function AdminDashboard() {
  const { orders } = useAdminOrders();
  const { products } = useAdminProducts();
  const { can } = useAdminAuth();
  const { greeting, emoji } = getTimeBasedGreeting();

  const [latency, setLatency] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [os, setOs] = useState("Detectando...");
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);

  useEffect(() => {
    const getOS = () => {
      if ("userAgentData" in navigator) {
        const data = navigator.userAgentData as { platform: string } | undefined;
        if (data?.platform) return data.platform;
      }
      return navigator.platform || "Sistema desconocido";
    };

    setOs(getOS());

    const checkLatency = async () => {
      setIsSyncing(true);
      const start = Date.now();
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setLatency(Date.now() - start);
      } finally {
        setIsSyncing(false);
      }
    };

    checkLatency();
    const interval = setInterval(checkLatency, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Métricas básicas ─────────────────────────────────────────────────────
  const ingresos = orders.reduce((acc, o) => acc + o.total, 0);
  const totalPedidos = orders.length;
  const clientesUnicos = Array.from(new Set(orders.map((o) => o.customer.email))).length;
  const tasaConversion = clientesUnicos === 0 ? 0 : (totalPedidos / clientesUnicos) * 100;

  // ─── Distribución por categoría ──────────────────────────────────────────
  function getCategoryDistribution() {
    const COLORS = [
      "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#a4de6c",
      "#d0ed57", "#8dd1e1", "#83a6ed", "#ea7e7e", "#b47ae7",
    ];
    const productCategoryMap = products.reduce(
      (acc, p) => {
        acc[p.id] = p.category?.name || "Sin categoría";
        return acc;
      },
      {} as Record<string, string>,
    );
    const categoryTotals: Record<string, number> = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const cat = productCategoryMap[item.productId] || "Sin categoría";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.quantity;
      });
    });
    return Object.entries(categoryTotals)
      .map(([category, value], idx) => ({
        category,
        value,
        color: COLORS[idx % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }

  // ─── Top 10 productos más vendidos ───────────────────────────────────────
  const topProducts: Array<{ name: string; sku: string; sales: number }> = [];
  const productSalesMap: Record<string, { name: string; sku: string; sales: number }> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
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
  topProducts.push(...Object.values(productSalesMap).sort((a, b) => b.sales - a.sales).slice(0, 10));

  // ─── Estado del sistema ──────────────────────────────────────────────────
  const statusConfig = {
    online: { color: "bg-green-500", ping: "bg-green-400", icon: "✅", text: "Online" },
    slow: { color: "bg-orange-500", ping: "bg-orange-400", icon: "⚠️", text: "Lento" },
    offline: { color: "bg-red-500", ping: "bg-red-400", icon: "❌", text: "Offline" },
  };

  const currentStatus = !navigator.onLine ? "offline" : latency > 500 ? "slow" : "online";
  const config = statusConfig[currentStatus];

  const categoryData = getCategoryDistribution();

  return (
    <div className={styles.page}>
      {/* ═══════════════════════════════════════════════════════════════════*/}
      {/* Welcome Banner */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className={styles.welcomeBanner}>
        <div className={styles.bannerContent}>
          <h1 className={styles.bannerGreeting}>
            {greeting}, administrador{emoji}
          </h1>
          <p className={styles.bannerSubtext}>
            Panel de control optimizado para acciones inmediatas. Focalizado en tareas críticas.
          </p>
        </div>
        <div className={styles.bannerIllustration}>📊</div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1️⃣ SECCIÓN PRIORITARIA: KPIs Accionables Críticos */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className={styles.criticalSection}>
        <div className={styles.criticalHeader}>
          <h2 className={styles.criticalTitle}>🚨 Acciones Requeridas</h2>
          <p className={styles.criticalSubtitle}>Tareas prioritarias que necesitan tu atención</p>
        </div>

        {can("orders.view") && (
          <div className={styles.criticalGrid}>
            <div className={styles.criticalCard}>
              <PendingOrdersAlert />
            </div>
            <div className={styles.criticalCard}>
              <ShippingAlertsWidget />
            </div>
            <div className={styles.criticalCard}>
              <PaymentAlertsWidget />
            </div>
          </div>
        )}

        {can("products.view") && (
          <div className={styles.criticalGrid}>
            <div className={styles.criticalCard}>
              <CriticalStockAlert
                products={products.map((p) => ({
                  id: p.id,
                  name: p.name,
                  stock: typeof p.stock === "number" ? p.stock : 0,
                }))}
              />
            </div>
            <div className={styles.criticalCard}>
              <IncompleteProductsWidget />
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2️⃣ SECCIÓN: Métricas Rápidas */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📈 Métricas Rápidas</h2>
        <div className={styles.metricsGrid}>
          <MetricCard
            title="Ingresos"
            icon={<span>💰</span>}
            value={ingresos.toLocaleString("es-AR", {
              style: "currency",
              currency: "ARS",
              minimumFractionDigits: 0,
            })}
            variation={0}
          />
          <MetricCard
            title="Pedidos"
            icon={<span>🛒</span>}
            value={totalPedidos}
            variation={0}
          />
          <MetricCard
            title="Clientes Únicos"
            icon={<span>👥</span>}
            value={clientesUnicos}
            variation={0}
          />
          <MetricCard
            title="Tasa de Conversión"
            icon={<span>📊</span>}
            value={tasaConversion.toFixed(1) + "%"}
            variation={0}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3️⃣ SECCIÓN: Acceso Rápido */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🚀 Acceso Rápido</h2>
        <div className={styles.grid}>
          {[
            {
              icon: "📦",
              title: "Productos",
              description: "Administrá el catálogo, precios y stock.",
              to: "/admin/productos",
              color: "primary",
              canAccess: can("products.view"),
            },
            {
              icon: "🛒",
              title: "Pedidos",
              description: "Revisá y gestioná los pedidos recibidos.",
              to: "/admin/pedidos",
              color: "accent",
              canAccess: can("orders.view"),
            },
            {
              icon: "📊",
              title: "Reportes",
              description: "Consultá métricas y estadísticas del negocio.",
              to: "/admin/reportes",
              color: "warm",
              canAccess: can("reports.view"),
            },
            {
              icon: "⚙️",
              title: "Configuración",
              description: "Ajustes generales de la tienda.",
              to: "/admin/settings",
              color: "secondary",
              canAccess: true,
            },
          ]
            .filter((sec) => sec.canAccess)
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4️⃣ SECCIÓN: Actividad Reciente */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⏰ Actividad Reciente</h2>
        <ActivityFeed />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5️⃣ SECCIÓN: Analítica Avanzada (Colapsable) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {can("reports.view") && (
        <section className={styles.section}>
          <div
            className={styles.sectionHeaderClickable}
            role="button"
            tabIndex={0}
            onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                setIsAnalyticsExpanded(!isAnalyticsExpanded);
              }
            }}
          >
            <h2 className={styles.sectionTitle}>📊 Analítica Avanzada</h2>
            <span className={styles.expandIcon}>{isAnalyticsExpanded ? "▼" : "▶"}</span>
          </div>

          {isAnalyticsExpanded && (
            <div className={styles.analyticsContainer}>
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsCard}>
                  <h3 className={styles.analyticsSubtitle}>Distribución por Categoría</h3>
                  <CategoryDistributionChart data={categoryData} />
                </div>
                <div className={styles.analyticsCard}>
                  <h3 className={styles.analyticsSubtitle}>Top 10 Productos Vendidos</h3>
                  <BarChartTopProducts data={topProducts} />
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Status Bar */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>💻</span>
          <span className={styles.statusText}>{os}</span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>🔒</span>
          <span className={styles.statusText}>
            Sesión: <span className="font-mono text-xs text-green-600">{latency}ms (BD)</span>
          </span>
        </div>

        <div className={styles.statusItem}>
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <span className="animate-spin text-blue-500 text-sm">🔄</span>
            ) : (
              <span className="relative flex h-2 w-2">
                {currentStatus !== "offline" && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.ping} opacity-75`}
                  ></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`}></span>
              </span>
            )}
            <span className={styles.statusIcon}>{isSyncing ? "" : config.icon}</span>
            <span className={styles.statusText}>
              {isSyncing ? "Sincronizando..." : config.text}
            </span>
          </div>
        </div>

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
