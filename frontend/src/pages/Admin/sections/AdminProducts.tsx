import styles from './AdminSection.module.css';

export function AdminProducts() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.label}>Administración</span>
        <h1 className={styles.title}>
          <span className={styles.icon}>📦</span> Productos
        </h1>
        <p className={styles.subtitle}>
          Gestioná el catálogo de productos, precios y disponibilidad.
        </p>
      </div>
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📦</span>
        <p className={styles.emptyText}>Próximamente podrás gestionar el catálogo de productos aquí.</p>
      </div>
    </div>
  );
}
