// Gráficos con lazy loading y skeletons
import React, { Suspense } from 'react';
const BarChart = React.lazy(() => import('./BarChart').then(m => ({ default: m.BarChart })));
const DonutChart = React.lazy(() => import('./DonutChart').then(m => ({ default: m.DonutChart })));
import { BarChartSkeleton, DonutChartSkeleton } from './Skeletons';

/**
 * Presenta los gráficos y skeletons, sin lógica de datos.
 */
export interface BarChartDatum {
    dateKey: string;
    label: string;
    value: number;
}
export interface DonutChartSlice {
    key: string;
    count: number;
}
export interface ReportsChartsProps {
    barData: BarChartDatum[];
    statusSlices: DonutChartSlice[];
    isLoading: boolean;
}

export function ReportsCharts({ barData, statusSlices, isLoading }: ReportsChartsProps) {
    if (isLoading) {
        return (
            <>
                <BarChartSkeleton />
                <DonutChartSkeleton />
            </>
        );
    }
    return (
        <>
            <Suspense fallback={<BarChartSkeleton />}>
                <BarChart data={barData} />
            </Suspense>
            <Suspense fallback={<DonutChartSkeleton />}>
                <DonutChart slices={statusSlices} />
            </Suspense>
        </>
    );
}
