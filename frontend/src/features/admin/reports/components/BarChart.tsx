import { useMemo, useState, useEffect } from 'react';
import styles from '../AdminReports.module.css';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= 600 : false
    );
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

type Props = {
    data: { label: string; value: number; dateKey: string }[];
    formatValue?: (n: number) => string;
};

/**
 * Gráfico de barras para visualización de datos temporales o categóricos.
 *
 * @param data Array de objetos con label, value y dateKey
 * @param formatValue Función opcional para formatear los valores
 */
const BarChart = ({ data, formatValue }: Props) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const isMobile = useIsMobile();

    const format = formatValue ?? ((n: number) => n.toString());

    const { maxVal, yTicks } = useMemo(() => {
        const maxVal = Math.max(...data.map(d => d.value), 1);
        const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
            pct: t,
            val: maxVal * t
        }));
        return { maxVal, yTicks };
    }, [data]);

    // Ajuste de ancho mínimo en mobile
    const W = isMobile ? 420 : 600;
    const H = 220;

    const getRange = (length: number) => {
        if (length <= 7) return 7;
        if (length <= 30) return 30;
        if (length <= 90) return 90;
        return 'all';
    };

    const range = getRange(data.length);

    const minWidth = useMemo(() => {
        if (isMobile) {
            switch (range) {
                case 7:
                case 30:
                    return 700;
                case 90:
                    return 4500;
                default:
                    return 700;
            }
        } else {
            switch (range) {
                case 7:
                case 30:
                    return 700;
                case 90:
                    return 4000;
                default:
                    return 700;
            }
        }
    }, [isMobile, range]);

    const padLeft = 50;
    const padBottom = 36;
    const padTop = 16;
    const padRight = 12;

    const chartH = H - padBottom - padTop;

    const minBarWidth = 14;
    const gap = 15;
    const calculatedW =
        data.length * (minBarWidth + gap) + padLeft + padRight;

    const dynamicW = Math.max(
        minWidth,
        calculatedW
    );

    const step = (dynamicW - padLeft - padRight) / data.length;

    const barW = Math.max(10, step - gap);
    const showAllLabels = data.length <= 90;

    const hoveredItem =
        hoveredIdx !== null ? data[hoveredIdx] : null;

    if (!data.length) return null;

    return (
        <div
            className={styles.chartWrap}
            style={isMobile ? { overflowX: dynamicW > W ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch' } : {}}
        >
            <svg
                viewBox={`0 0 ${dynamicW} ${H}`}
                className={styles.barChartSvg}
                style={{ minWidth: dynamicW }}
            >
                {/* GRID */}
                {yTicks.map(t => {
                    const y = padTop + chartH - t.pct * chartH;

                    return (
                        <g key={t.pct}>
                            <line
                                x1={padLeft}
                                x2={dynamicW - padRight}
                                y1={y}
                                y2={y}
                                stroke="#E5E2DD"
                            />
                            <text
                                x={padLeft - 6}
                                y={y + 4}
                                textAnchor="end"
                                fontSize={9}
                                fill="#767676"
                            >
                                {format(t.val)}
                            </text>
                        </g>
                    );
                })}

                {/* BARRAS */}
                {data.map((d, i) => {
                    const barH = (d.value / maxVal) * chartH;

                    const x =
                        padLeft +
                        i * step +
                        (step - barW) / 2;

                    const y = padTop + chartH - barH;

                    const isHovered = hoveredIdx === i;

                    const formatShortDate = (dateKey: string) => {
                        const date = new Date(dateKey);

                        return date.toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short'
                        });
                    };

                    return (
                        <g
                            key={d.dateKey}
                            tabIndex={0}
                            role="img"
                            aria-label={`${d.label}: ${format(d.value)}`}
                            onFocus={() => setHoveredIdx(i)}
                            onBlur={() => setHoveredIdx(null)}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            style={{ outline: "none", borderRadius: 0, }}
                        >
                            <rect
                                x={x}
                                y={y}
                                width={barW}
                                height={Math.max(barH, 2)}
                                rx={3}
                                fill={isHovered ? '#0284c7' : '#7dd3fc'}
                            />

                            {/* LABEL */}

                            {showAllLabels && (
                                <text
                                    x={x + barW / 2}
                                    y={padTop + chartH + 16}
                                    textAnchor="middle"
                                    fontSize={9}
                                    fill="#94a3b8"
                                    fontWeight="500"
                                    transform={`rotate(-40, ${x + barW / 2}, ${padTop + chartH + 28})`}
                                >
                                    {formatShortDate(d.dateKey)}
                                </text>
                            )
                            }


                        </g>
                    );
                })}
                {/* TOOLTIP */}
                {hoveredIdx !== null && hoveredItem && (() => {
                    const step = (dynamicW - padLeft - padRight) / data.length;
                    const barH = (hoveredItem.value / maxVal) * chartH;

                    const x =
                        padLeft +
                        hoveredIdx * step +
                        (step - barW) / 2;

                    const y = padTop + chartH - barH;

                    const tooltipY = y < 40 ? y + 10 : y - 42;

                    return (
                        <g>
                            <rect
                                x={x + barW / 2 - 50}
                                y={tooltipY}
                                width={100}
                                height={28}
                                rx={6}
                                fill="#0ea5e9"
                            />
                            <text
                                x={x + barW / 2}
                                y={tooltipY + 18}
                                textAnchor="middle"
                                fontSize={10}
                                fill="#fff"
                                fontWeight="600"
                            >
                                {format(hoveredItem.value)}
                            </text>
                        </g>
                    );
                })()}
            </svg>
        </div >
    );
}

export default BarChart;