import React from 'react';

interface DonutChartProps {
    slices: Array<{ key: string; count: number }>;
}

const COLORS = [
    '#4f8cff', '#00c49f', '#ffbb28', '#ff8042', '#a28cff', '#ff4f81', '#b6e880', '#ffd700', '#ff7f50', '#87ceeb',
];

export const DonutChart: React.FC<DonutChartProps> = ({ slices }) => {
    const total = slices.reduce((sum, s) => sum + s.count, 0);
    let acc = 0;
    const arcs = slices.map((s, i) => {
        const start = (acc / total) * 2 * Math.PI;
        acc += s.count;
        const end = (acc / total) * 2 * Math.PI;
        const largeArc = end - start > Math.PI ? 1 : 0;
        const x1 = 50 + 40 * Math.sin(start);
        const y1 = 50 - 40 * Math.cos(start);
        const x2 = 50 + 40 * Math.sin(end);
        const y2 = 50 - 40 * Math.cos(end);
        return (
            <path
                key={s.key}
                d={`M50,50 L${x1},${y1} A40,40 0 ${largeArc} 1 ${x2},${y2} Z`}
                fill={COLORS[i % COLORS.length]}
                stroke="#fff"
                strokeWidth={1}
            />
        );
    });
    return (
        <svg width={100} height={100} viewBox="0 0 100 100" aria-label="Distribución de estados">
            {arcs}
        </svg>
    );
};
