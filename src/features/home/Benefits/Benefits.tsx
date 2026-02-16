import styles from './Benefits.module.css';

const benefits = [
  {
    icon: '🚚',
    title: 'Envíos a todo el país',
    description: 'Gratis en CABA y GBA. Coordinamos tu entrega.',
  },
  {
    icon: '🔒',
    title: 'Comprá con seguridad',
    description: 'Atención personalizada y medios de pago seguros.',
  },
  {
    icon: '💳',
    title: 'Múltiples medios de pago',
    description: 'Transferencia, e-check, Mercado Pago y más.',
  },
  {
    icon: '📦',
    title: 'Retiro sin cargo',
    description: 'Retirá tu pedido sin costo con previa coordinación.',
  },
];

export function Benefits() {
  return (
    <section className={styles.section} aria-label="Beneficios">
      <div className={styles.grid}>
        {benefits.map((b) => (
          <div className={styles.benefit} key={b.title}>
            <div className={styles.iconWrapper} aria-hidden="true">
              {b.icon}
            </div>
            <h3 className={styles.title}>{b.title}</h3>
            <p className={styles.description}>{b.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
