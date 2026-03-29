// Skeletons reutilizables para gráficos y KPIs
import React from 'react';
import styles from '../AdminReports.module.css';

const BAR_HEIGHTS = [40, 65, 30, 80, 55, 70, 45, 60, 35, 75];

/** Skeleton para BarChart */
export const BarChartSkeleton = React.memo(() => (
    <div className={styles.skeletonChartContainer}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', width: '100%' }}>
            {Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    className={styles.skeletonChartBar + ' skeleton'}
                    style={{ height: `${BAR_HEIGHTS[i % BAR_HEIGHTS.length]}%` }}
                />
            ))}
        </div>
    </div>
));

/** Skeleton para DonutChart */
export const DonutChartSkeleton = React.memo(() => (
    <div className={styles.donutWrap}>
        <div className={styles.skeletonDonut + ' skeleton'}></div>
        <div className={styles.skeletonLegend}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.skeletonLegendItem + ' skeleton'}></div>
            ))}
        </div>
    </div>
));
