import styles from './AdminSection.module.css';

export function AdminReports() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.label}>Administración</span>
        <h1 className={styles.title}>
          <span className={styles.icon}>📊</span> Reportes
        </h1>
        <p className={styles.subtitle}>
          Consultá métricas, estadísticas de ventas y rendimiento del negocio.
        </p>
      </div>
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📊</span>
        <p className={styles.emptyText}>Próximamente podrás ver reportes y estadísticas aquí.</p>
      </div>
    </div>
  );
}
