import React, { useState } from 'react';
import styles from '../AdminReports.module.css';

interface DonutChartProps {
    slices: Array<{ key: string; count: number }>;
}

/* 🎨 Colores por estado */
const STATUS_COLORS: Record<string, string> = {
    pendiente: '#f59e0b',
    confirmado: '#3b82f6',
    'en-preparacion': '#8b5cf6',
    enviado: '#06b6d4',
    entregado: '#22c55e',
    cancelado: '#ef4444',
};

/* 🏷️ Labels */
const STATUS_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    'en-preparacion': 'En preparación',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
};



/**
 * Gráfico de torta/donut para distribución de estados de pedidos.
 *
 * @param slices Array de segmentos con key y count
 */
export const DonutChart: React.FC<DonutChartProps> = ({ slices }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    const total = slices.reduce((sum, s) => sum + s.count, 0);

    const R = 56; // radio externo
    const r = 36; // radio interno
    const cx = 80;
    const cy = 80;

    let currentAngle = -Math.PI / 2;

    if (total === 0) {
        return <p className={styles.noData}>Sin datos</p>;
    }

    const arcs = slices
        .filter(s => s.count > 0)
        .map((s, i) => {
            const angle = (s.count / total) * 2 * Math.PI;

            const x1o = cx + R * Math.cos(currentAngle);
            const y1o = cy + R * Math.sin(currentAngle);

            const x2o = cx + R * Math.cos(currentAngle + angle);
            const y2o = cy + R * Math.sin(currentAngle + angle);

            const x1i = cx + r * Math.cos(currentAngle + angle);
            const y1i = cy + r * Math.sin(currentAngle + angle);

            const x2i = cx + r * Math.cos(currentAngle);
            const y2i = cy + r * Math.sin(currentAngle);

            const largeArc = angle > Math.PI ? 1 : 0;

            const d = `
        M ${x1o} ${y1o}
        A ${R} ${R} 0 ${largeArc} 1 ${x2o} ${y2o}
        L ${x1i} ${y1i}
        A ${r} ${r} 0 ${largeArc} 0 ${x2i} ${y2i}
        Z
      `;

            currentAngle += angle;

            return {
                key: s.key,
                count: s.count,
                path: d,
                color: STATUS_COLORS[s.key] ?? '#ccc',
                index: i,
            };
        });

    return (
        <div className={styles.donutWrap}>
            <svg
                viewBox="0 0 160 160"
                className={styles.donutSvg}
                aria-label="Distribución de pedidos"
            >
                {arcs.map((arc) => {

                    return (
                        <path
                            key={arc.key}
                            d={arc.path}
                            fill={arc.color}
                            stroke="#fff"
                            strokeWidth={2}
                            onMouseEnter={() => setHovered(arc.index)}
                            onMouseLeave={() => setHovered(null)}
                            opacity={hovered === null || hovered === arc.index ? 1 : 0.4}
                            style={{ transition: 'all 0.2s ease' }}
                        />
                    );
                })}

                {/* 🧠 Centro */}
                <text
                    x={cx}
                    y={cy - 5}
                    textAnchor="middle"
                    fontSize={18}
                    fontWeight="700"
                    fill="#1A1A1A"
                >
                    {total}
                </text>

                <text
                    x={cx}
                    y={cy + 13}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#767676"
                >
                    pedidos
                </text>

                {/* ✅ TOOLTIP DENTRO DEL SVG */}
                {hovered !== null && (() => {
                    const arc = arcs[hovered];
                    const pct = Math.round((arc.count / total) * 100);

                    const startAngle = arcs
                        .slice(0, hovered)
                        .reduce((acc, a) => acc + (a.count / total) * 2 * Math.PI, -Math.PI / 2);

                    const sliceAngle = (arc.count / total) * 2 * Math.PI;
                    const midAngle = startAngle + sliceAngle / 2;

                    const tooltipX = cx + (R + 12) * Math.cos(midAngle);
                    const tooltipY = cy + (R + 12) * Math.sin(midAngle);

                    return (
                        <g pointerEvents="none">
                            <rect
                                x={tooltipX - 45}
                                y={tooltipY - 20}
                                width={90}
                                height={32}
                                rx={6}
                                fill={arc.color}
                            />
                            <text
                                x={tooltipX}
                                y={tooltipY - 6}
                                textAnchor="middle"
                                fontSize={10}
                                fill="#fff"
                                fontWeight="600"
                            >
                                {STATUS_LABELS[arc.key]}
                            </text>
                            <text
                                x={tooltipX}
                                y={tooltipY + 8}
                                textAnchor="middle"
                                fontSize={9}
                                fill="#fff"
                            >
                                {arc.count} ({pct}%)
                            </text>
                        </g>
                    );
                })()}
            </svg>


            {/* 📊 Leyenda */}
            <ul className={styles.donutLegend}>
                {arcs.map((arc) => {
                    const pct = Math.round((arc.count / total) * 100);

                    return (
                        <li key={arc.key} className={styles.donutLegendItem}>
                            <span
                                className={styles.donutLegendDot}
                                style={{ background: arc.color }}
                            />

                            <span className={styles.donutLegendLabel}>
                                {STATUS_LABELS[arc.key]}
                            </span>

                            {/* 🔢 número con color */}
                            <span
                                className={styles.donutLegendCount}
                                style={{ color: arc.color, fontWeight: 600 }}
                            >
                                {arc.count}
                            </span>

                            {/* 📊 porcentaje con color */}
                            <span
                                className={styles.donutLegendPct}
                                style={{ color: arc.color }}
                            >
                                ({pct}%)
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};