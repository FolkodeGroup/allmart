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
import { Link } from 'react-router-dom';
// import { useAdminAuth } from '../../context/AdminAuthContext';
import WeeklySalesWidget from '../../components/ui/WeeklySalesWidget';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import styles from './AdminDashboard.module.css';
import type { WeeklySalesData } from '../../components/ui/WeeklySalesWidget';
import MetricCard from '../../components/ui/MetricCard';

export function AdminDashboard() {
  const { orders } = useAdminOrders();
  // --- Métricas mensuales ---
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Filtrar pedidos por mes
  const ordersThisMonth = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const ordersPrevMonth = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  // Ingresos
  const ingresosActual = ordersThisMonth.reduce((acc, o) => acc + o.total, 0);
  const ingresosPrevio = ordersPrevMonth.reduce((acc, o) => acc + o.total, 0);
  const ingresosVar = ingresosPrevio === 0 ? 0 : ((ingresosActual - ingresosPrevio) / ingresosPrevio) * 100;

  // Pedidos
  const pedidosActual = ordersThisMonth.length;
  const pedidosPrevio = ordersPrevMonth.length;
  const pedidosVar = pedidosPrevio === 0 ? 0 : ((pedidosActual - pedidosPrevio) / pedidosPrevio) * 100;

  // Nuevos clientes (emails únicos)
  const clientesActual = Array.from(new Set(ordersThisMonth.map(o => o.customer.email))).length;
  const clientesPrevio = Array.from(new Set(ordersPrevMonth.map(o => o.customer.email))).length;
  const clientesVar = clientesPrevio === 0 ? 0 : ((clientesActual - clientesPrevio) / clientesPrevio) * 100;

  // Tasa de conversión (pedidos/clientes)
  const conversionActual = clientesActual === 0 ? 0 : (pedidosActual / clientesActual) * 100;
  const conversionPrevio = clientesPrevio === 0 ? 0 : (pedidosPrevio / clientesPrevio) * 100;
  const conversionVar = conversionPrevio === 0 ? 0 : ((conversionActual - conversionPrevio) / conversionPrevio) * 100;

  // --- Gráfico semanal ---
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  const dayLabels = days.map(d => d.toLocaleDateString('es-AR', { weekday: 'short' }));
  function getWeeklyOrderCounts(): WeeklySalesData[] {
    return days.map((day, idx) => {
      const count = orders.filter(order => {
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
  const salesData = getWeeklyOrderCounts();
  const totalSales = salesData.reduce((acc, d) => acc + d.sales, 0);

  return (
    <div className={styles.page}>
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
          {sections.map(sec => (
            <Link key={sec.to} to={sec.to} className={`${styles.card} ${styles[`card_${sec.color}`]}`}>
              <span className={styles.cardIcon}>{sec.icon}</span>
              <div>
                <h3 className={styles.cardTitle}>{sec.title}</h3>
                <p className={styles.cardDesc}>{sec.description}</p>
              </div>
              <span className={styles.cardArrow}>→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Métricas mensuales */}
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

      {/* Ventas Semanales Widget */}
      <section className={styles.section}>
        <WeeklySalesWidget data={salesData} totalSales={totalSales} />
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
