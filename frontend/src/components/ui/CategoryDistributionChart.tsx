import React from 'react';
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
  // Posicionar etiqueta fuera del gráfico para mayor legibilidad
  const radius = outerRadius + 60;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#1a1a1a"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={13}
      fontWeight={600}
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
    >
      {percent > 0 ? `${(percent * 100).toFixed(1)}%` : ''}
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
  if (!data || data.length === 0) {
    return <div className={styles.empty}>No hay datos para mostrar.</div>;
  }
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Distribución por Categoría</h2>
      <ResponsiveContainer width="100%" height={480}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="category"
            cx="45%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            labelLine={true}
            label={renderCustomizedLabel}
            isAnimationActive={true}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value: string) => <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{value}</span>}
            wrapperStyle={{ paddingLeft: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryDistributionChart;
