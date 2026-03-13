import React from 'react';
import { Link } from 'react-router-dom';

// ── Función de saludo dinámico según la hora del día ──
function getTimeBasedGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return { greeting: 'Buenos días', emoji: '🌅' };
  } else if (hour >= 12 && hour < 20) {
    return { greeting: 'Buenas tardes', emoji: '☀️' };
  } else {
    return { greeting: 'Buenas noches', emoji: '🌙' };
  }
}

const sections = [
  {
    icon: '📦',
    title: 'Productos',
    description: 'Administrá el catálogo, precios y stock.',
    to: '/admin/productos',
    color: 'primary',
  },
  {
    icon: '🛒',
    title: 'Pedidos',
    description: 'Revisá y gestioná los pedidos recibidos.',
    to: '/admin/pedidos',
    color: 'accent',
  },
  {
    icon: '📊',
    title: 'Reportes',
    description: 'Consultá métricas y estadísticas del negocio.',
    to: '/admin/reportes',
    color: 'warm',
  },
];
import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import WeeklySalesWidget from '../../components/ui/WeeklySalesWidget';
import CategoryDistributionChart from '../../components/ui/CategoryDistributionChart';
import BarChartTopProducts from '../../components/ui/BarChartTopProducts';
import RecentOrdersWidget from '../../components/ui/RecentOrdersWidget';
import SalesActivityHeatmap from '../../components/ui/SalesActivityHeatmap';
import MonthlyGoalWidget from '../../components/ui/MonthlyGoalWidget';
import { useAdminProducts } from '../../context/AdminProductsContext';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import CriticalStockAlert from '../../components/ui/CriticalStockAlert';
import DateRangeCard from '../../components/ui/DateRangeCard';
import styles from './AdminDashboard.module.css';
import type { WeeklySalesData } from '../../components/ui/WeeklySalesWidget';
import MetricCard from '../../components/ui/MetricCard';

export function AdminDashboard() {
  const { orders } = useAdminOrders();
  const { products } = useAdminProducts();
  const { can } = useAdminAuth();
  const { greeting, emoji } = getTimeBasedGreeting();
  const [dateRange, setDateRange] = React.useState(() => {
    // Por defecto: últimos 7 días
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 6);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    };
  });

  // Helper para filtrar por rango de fechas (inclusive)
  function isInRange(dateStr: string) {
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);
    const from = new Date(dateRange.from);
    from.setHours(0,0,0,0);
    const to = new Date(dateRange.to);
    to.setHours(23,59,59,999);
    return d >= from && d <= to;
  }

  // Filtrar pedidos por rango
  const filteredOrders = orders.filter(o => isInRange(o.createdAt));

  // --- Métricas ---
  // Para comparación, calculamos el rango anterior de igual cantidad de días
  const rangeDays = Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000*60*60*24)) + 1;
  const prevFrom = new Date(dateRange.from);
  prevFrom.setDate(prevFrom.getDate() - rangeDays);
  const prevTo = new Date(dateRange.from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevRange = {
    from: prevFrom.toISOString().slice(0,10),
    to: prevTo.toISOString().slice(0,10),
  };
  function isInPrevRange(dateStr: string) {
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);
    const from = new Date(prevRange.from);
    from.setHours(0,0,0,0);
    const to = new Date(prevRange.to);
    to.setHours(23,59,59,999);
    return d >= from && d <= to;
  }
  const prevOrders = orders.filter(o => isInPrevRange(o.createdAt));

  // Ingresos
  const ingresosActual = filteredOrders.reduce((acc, o) => acc + o.total, 0);
  const ingresosPrevio = prevOrders.reduce((acc, o) => acc + o.total, 0);
  const ingresosVar = ingresosPrevio === 0 ? 0 : ((ingresosActual - ingresosPrevio) / ingresosPrevio) * 100;

  // Pedidos
  const pedidosActual = filteredOrders.length;
  const pedidosPrevio = prevOrders.length;
  const pedidosVar = pedidosPrevio === 0 ? 0 : ((pedidosActual - pedidosPrevio) / pedidosPrevio) * 100;

  // Nuevos clientes (emails únicos)
  const clientesActual = Array.from(new Set(filteredOrders.map(o => o.customer.email))).length;
  const clientesPrevio = Array.from(new Set(prevOrders.map(o => o.customer.email))).length;
  const clientesVar = clientesPrevio === 0 ? 0 : ((clientesActual - clientesPrevio) / clientesPrevio) * 100;

  // Tasa de conversión (pedidos/clientes)
  const conversionActual = clientesActual === 0 ? 0 : (pedidosActual / clientesActual) * 100;
  const conversionPrevio = clientesPrevio === 0 ? 0 : (pedidosPrevio / clientesPrevio) * 100;
  const conversionVar = conversionPrevio === 0 ? 0 : ((conversionActual - conversionPrevio) / conversionPrevio) * 100;

  // --- Gráfico semanal (ahora: gráfico por días del rango seleccionado) ---
  const days: Date[] = [];
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  const dayLabels = days.map(d => d.toLocaleDateString('es-AR', { weekday: 'short' }));
  function getOrderCountsByDay(): WeeklySalesData[] {
    return days.map((day, idx) => {
      const count = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getFullYear() === day.getFullYear() &&
          orderDate.getMonth() === day.getMonth() &&
          orderDate.getDate() === day.getDate();
      }).length;
      return {
        day: dayLabels[idx].charAt(0).toUpperCase() + dayLabels[idx].slice(1),
        sales: count,
      };
    });
  }
  const salesData = getOrderCountsByDay();
  const totalSales = salesData.reduce((acc, d) => acc + d.sales, 0);

  // --- Mapa de calor de ventas (día/hora) ---
  // Eje vertical: días de la semana (Lunes a Domingo)
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  // Eje horizontal: horas (0-23)
  const hourLabels = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'));
  // Inicializar matriz [día][hora]
  const heatmapData: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  filteredOrders.forEach(order => {
    const d = new Date(order.createdAt);
    const dayIdx = d.getDay(); // 0=Dom, 1=Lun, ...
    const hourIdx = d.getHours();
    heatmapData[dayIdx][hourIdx] += 1;
  });

  // --- Distribución por categoría (ventas) ---
  function getCategoryDistribution() {
    // Colores por defecto
    const COLORS = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#8dd1e1', '#83a6ed', '#ea7e7e', '#b47ae7',
    ];
    // Map productId -> category
    const productCategoryMap = products.reduce((acc, p) => {
      acc[p.id] = p.category?.name || 'Sin categoría';
      return acc;
    }, {} as Record<string, string>);
    // Agrupar ventas por categoría
    const categoryTotals: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const cat = productCategoryMap[item.productId] || 'Sin categoría';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + item.quantity;
      });
    });
    // Formatear para el gráfico
    return Object.entries(categoryTotals).map(([category, value], idx) => ({
      category,
      value,
      color: COLORS[idx % COLORS.length],
    })).sort((a, b) => b.value - a.value);
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
  filteredOrders.forEach(order => {
    const email = order.customer.email;
    if (!clientesMap[email]) {
      clientesMap[email] = {
        nombre: `${order.customer.firstName} ${order.customer.lastName}`.trim() || email,
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
  const productSalesMap: Record<string, { name: string; sku: string; sales: number }> = {};
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        // Buscar el producto para obtener el SKU
        const prod = products.find(p => p.id === item.productId);
        productSalesMap[item.productId] = {
          name: item.productName,
          sku: prod?.sku || '',
          sales: 0,
        };
      }
      productSalesMap[item.productId].sales += item.quantity;
    });
  });
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);

  return (
    <div className={styles.page}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.bannerContent}>
          <h1 className={styles.bannerGreeting}>
            {greeting}, administrador{emoji}
          </h1>
          <p className={styles.bannerSubtext}>
            Continuemos gestionando tu tienda con éxito. Aquí encontrarás todas las herramientas que necesitas.
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

      {/* Quick access cards */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Acceso rápido</h2>
        <div className={styles.grid}>
          {sections
            .filter(sec => {
              if (sec.to === '/admin/productos') return can('products.view');
              if (sec.to === '/admin/pedidos') return can('orders.view');
              if (sec.to === '/admin/reportes') return can('reports.view');
              return true;
            })
            .map(sec => (
            <Link key={sec.to} to={sec.to} className={`${styles.card} ${styles[`card_${sec.color}`]}`}>
              <span className={styles.cardIcon}>{sec.icon}</span>
              <div>
                <h3 className={styles.cardTitle}>{sec.title}</h3>
                <p className={styles.cardDesc}>{sec.description}</p>
              </div>
              
            </Link>
          ))}
        </div>
      </section>

      {/* Alerta de Stock Crítico (Filtro Rápido) */}
      <CriticalStockAlert
        products={products.map(p => ({
          id: p.id,
          name: p.name,
          stock: typeof p.stock === 'number' ? p.stock : 0,
        }))}
      />

      {/* Filtro global de rango de fechas */}
      <section className={styles.section}>
        <DateRangeCard value={dateRange} onChange={setDateRange} />
      </section>

      {/* Métricas mensuales */}
      {can('reports.view') && (
        <section className={styles.metricsSection}>
          <div className={styles.metricsGrid}>
            <MetricCard
              title="Ingresos"
              icon={<span>💰</span>}
              value={ingresosActual.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
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
              value={conversionActual.toFixed(1) + '%'}
              variation={conversionVar}
            />
          </div>
        </section>
      )}

      {/* Gráficos: Ventas y Distribución por Categoría */}
      <section className={styles.section}>
        <div className={styles.chartsGrid}>
          <div className={styles.chartLeft}>
            {can('reports.view') && (
              <>
                <WeeklySalesWidget data={salesData} totalSales={totalSales} />
                {/* Mapa de calor de ventas debajo del gráfico de líneas */}
                <SalesActivityHeatmap
                  data={heatmapData}
                  dayLabels={weekDays}
                  hourLabels={hourLabels}
                />
              </>
            )}
          </div>
          <div className={styles.chartRight}>
            {can('reports.view') && (
              <>
                <CategoryDistributionChart data={categoryData} />
                <div className={styles.goalAndClientsRow}>
                  <div className={styles.goalCard}>
                    <MonthlyGoalWidget ventasDelMes={ingresosActual} />
                  </div>
                  <div className={styles.metricCard}>
                    <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Mejores Clientes</h3>
                    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      <li style={{ display: 'flex', fontWeight: 600, color: '#888', borderBottom: '1px solid #eee', paddingBottom: 4, marginBottom: 6 }}>
                        <span style={{ flex: 2 }}>Cliente</span>
                        <span style={{ flex: 1, textAlign: 'center' }}>Pedidos</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
                      </li>
                      {mejoresClientes.map((c, idx) => (
                        <li key={c.email} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', borderBottom: idx < mejoresClientes.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                          <span style={{ flex: 2, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre}</span>
                          <span style={{ flex: 1, textAlign: 'center' }}>{c.pedidos}</span>
                          <span style={{ flex: 1, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.totalGastado.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                {/* Gráfico de barras Top 10 productos más vendidos */}
                <BarChartTopProducts data={topProducts} />
              </>
            )}
          </div>
        </div>
        {/* Pedidos Recientes */}
        {can('orders.view') && <RecentOrdersWidget />}
      </section>

      {/* Status bar */}
      <section className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>✅</span>
          <span className={styles.statusText}>Sistema operativo</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>🔒</span>
          <span className={styles.statusText}>Sesión autenticada</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusIcon}>🕐</span>
          <span className={styles.statusText}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </section>
    </div>
  );
}
