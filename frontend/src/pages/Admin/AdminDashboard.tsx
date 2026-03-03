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


export function AdminDashboard() {
  const { orders } = useAdminOrders();

  // Últimos 7 días
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  const dayLabels = days.map(d => d.toLocaleDateString('es-AR', { weekday: 'short' }));

  // Contar pedidos por día
  function getWeeklyOrderCounts(): WeeklySalesData[] {
    return days.map((day, idx) => {
      // Pedidos cuyo createdAt es ese día
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
