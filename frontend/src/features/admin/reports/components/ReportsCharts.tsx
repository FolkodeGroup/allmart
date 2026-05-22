// Gráficos con lazy loading y skeletons
import React, { Suspense } from 'react';
const BarChart = React.lazy(() => import('../components/BarChart'));
import { BarChartSkeleton } from './Skeletons';

/**
 * Presenta los gráficos y skeletons, sin lógica de datos.
 */
export interface BarChartDatum {
    dateKey: string;
    label: string;
    value: number;
}
export interface ReportsChartsProps {
    barData: BarChartDatum[];
    isLoading: boolean;
    monthlyGoal: number;
}

export function ReportsCharts({ barData, isLoading, monthlyGoal }: ReportsChartsProps) {
    if (isLoading) {
        return <BarChartSkeleton />;
    }
    return (
        <Suspense fallback={<BarChartSkeleton />}>
            <BarChart data={barData} monthlyGoal={monthlyGoal} />
        </Suspense>
    );
}
