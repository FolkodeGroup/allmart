import React from 'react';
import styles from '../AdminReports.module.css';

export interface MetricCardProps {
    label: string;
    value: React.ReactNode;
    highlight?: boolean;
    trend?: number; // Porcentaje de cambio para mostrar tendencia
}

export const MetricCard: React.FC<MetricCardProps & { colorClass?: string }> = ({ label, value, trend, colorClass }) => (
    <div className={[
        styles.metricCard,
        colorClass ? styles[colorClass] : '',
    ].filter(Boolean).join(' ')}>
        <div className={styles.metricLabel}>{label}</div>
        <div className={styles.metricValue}>{value}</div>
        {trend !== undefined && (
            <div className={styles.metricTrend + ' ' + (trend > 0 ? styles.trendUp : trend < 0 ? styles.trendDown : styles.trendNeutral)}>
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)}%
            </div>
        )}
    </div>
);

interface ReportsMetricsProps {
    metrics: Array<MetricCardProps & { key: string }>;
}

// Asignar colorClass según key de la métrica
const metricColorMap: Record<string, string> = {
    revenue: 'metricCardRevenue',
    orders: 'metricCardOrders',
    avgTicket: 'metricCardAvgTicket',
    completion: 'metricCardCompletion',
    paid: 'metricCardPaid',
};

/**
 * Muestra los KPIs principales de los reportes (ingresos, pedidos, ticket promedio, etc).
 *
 * @param metrics Array de métricas a mostrar (cada una con key, label, valor, icono y tendencia opcional)
 */
export const ReportsMetrics: React.FC<ReportsMetricsProps> = ({ metrics }) => (
    <div className={styles.metricsGrid}>
        {metrics.map(({ key, ...rest }) => (
            <MetricCard key={key} colorClass={metricColorMap[key] || ''} {...rest} />
        ))}
    </div>
);
