// Presenta las tarjetas de KPIs, sin lógica de negocio
import styles from '../AdminReports.module.css';

/**
 * Renderiza las tarjetas de métricas (KPI).
 */
export interface KPIMetric {
    key: string;
    icon: string;
    label: string;
    value: string | number;
}

export function KPICards({ metrics, isLoading }: { metrics: KPIMetric[]; isLoading: boolean }) {
    return (
        <div className={styles.metricsGrid}>
            {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={styles.kpiCard + ' skeleton'} />
                ))
                : metrics.map(m => (
                    <div key={m.key} className={styles.kpiCard}>
                        <span className={styles.kpiIcon}>{m.icon}</span>
                        <div className={styles.kpiBody}>
                            <span className={styles.kpiValue}>{m.value}</span>
                            <span className={styles.kpiLabel}>{m.label}</span>
                        </div>
                    </div>
                ))}
        </div>
    );
}
