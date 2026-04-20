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
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#333" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={14}>
      {percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
    </text>
  );
};

const CategoryDistributionChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className={styles.empty}>No hay datos para mostrar.</div>;
  }
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Distribución por Categoría</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            labelLine={false}
            label={renderCustomizedLabel}
            isAnimationActive={true}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [`${value ?? 0} ventas`, String(name)]} />
          <Legend layout="vertical" align="right" verticalAlign="middle" formatter={(value: string) => <span style={{ fontSize: 14 }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryDistributionChart;
