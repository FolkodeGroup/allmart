import React from 'react';
import styles from '../AdminReports.module.css';

export interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps & { colorClass?: string }> = ({ icon, label, value, highlight, colorClass }) => (
    <div className={[
        styles.metricCard,
        colorClass ? styles[colorClass] : '',
    ].filter(Boolean).join(' ')}>
        <div className={styles.metricIcon}>{icon}</div>
        <div className={styles.metricValue}>{value}</div>
        <div className={styles.metricLabel}>{label}</div>
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

export const ReportsMetrics: React.FC<ReportsMetricsProps> = ({ metrics }) => (
    <div className={styles.metricsGrid}>
        {metrics.map(({ key, ...rest }) => (
            <MetricCard key={key} colorClass={metricColorMap[key] || ''} {...rest} />
        ))}
    </div>
);
