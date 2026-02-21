import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import styles from './AdminDashboard.module.css';

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

export function AdminDashboard() {
  const { user } = useAdminAuth();

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className={styles.label}>Panel de administración</span>
          <h1 className={styles.title}>¡Bienvenido, {user}!</h1>
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
