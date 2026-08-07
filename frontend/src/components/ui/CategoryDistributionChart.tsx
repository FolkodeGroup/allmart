import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './CategoryDistributionChart.module.css';

export interface CategoryDistributionData {
  category: string;
  value: number;
  color: string;
}

interface Props {
  data: CategoryDistributionData[];
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#8dd1e1', '#83a6ed', '#ea7e7e', '#b47ae7',
];

interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent }: PieLabelProps) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      className={styles.pieText}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
      fill="var(--color-text-primary, #ffffff)"
    >
      {percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
    </text>
  );
};

interface TooltipPayloadEntry {
  payload: { category: string; value: number };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) => {
  if (active && payload && payload.length) {
    const { category, value } = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{category}</div>
        <div>Ventas: <span style={{ fontWeight: 600 }}>{value}</span></div>
      </div>
    );
  }
  return null;
};

const CategoryDistributionChart: React.FC<Props> = ({ data }) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!data || data.length === 0) {
    return <div className={styles.empty}>No hay datos para mostrar.</div>;
  }

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Distribución por Categoría</h2>

      <ResponsiveContainer width="100%" height={isMobile ? 240 : 380}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="category"
            cx={isMobile ? '50%' : '45%'}
            cy="50%"
            innerRadius={isMobile ? 50 : 70}
            outerRadius={isMobile ? 80 : 110}
            labelLine={!isMobile}
            label={!isMobile ? renderCustomizedLabel : false}
            isAnimationActive={true}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {!isMobile && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value: string) => (
                <span className={styles.legendText}>
                  {value}
                </span>
              )}
              wrapperStyle={{ paddingLeft: '10px' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Leyenda vertical ordenada debajo en móvil */}
      {isMobile && (
        <div className={styles.mobileLegendList}>
          {data.map((item, idx) => {
            const percent = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';
            return (
              <div key={item.category} className={styles.mobileLegendItem}>
                <span
                  className={styles.mobileLegendDot}
                  style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }}
                />
                <span className={styles.mobileLegendName}>{item.category}</span>
                <span className={styles.mobileLegendVal}>{item.value} ({percent}%)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryDistributionChart;