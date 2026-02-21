import styles from './AdminSection.module.css';

export function AdminOrders() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.label}>Administración</span>
        <h1 className={styles.title}>
          <span className={styles.icon}>🛒</span> Pedidos
        </h1>
        <p className={styles.subtitle}>
          Revisá, procesá y gestioná los pedidos de clientes.
        </p>
      </div>
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>🛒</span>
        <p className={styles.emptyText}>Próximamente podrás gestionar los pedidos aquí.</p>
      </div>
    </div>
  );
}
