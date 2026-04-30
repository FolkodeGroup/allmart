
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import styles from './BarChartTopProducts.module.css';


export interface TopProductData {
  name: string;
  sku: string;
  sales: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export function truncateLabel(text: string, maxLength: number = 13): string {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}


interface Props {
  data: TopProductData[];
}


const ORANGE_PALETTE = [
  'var(--color-accent)', // principal naranja del proyecto
  '#ffb347', '#ffcc80', '#ff9800', '#ffa726', '#ff7043', '#ffab91', '#ff6f00', '#ff8a65', '#ffd180',
];

/**
 * Trunca un texto a maxLength caracteres y agrega "..." si es necesario.
 * @param text Texto original
 * @param maxLength Máximo de caracteres permitidos
 * @returns Texto truncado
 */


interface TooltipPayloadEntry {
  payload: { name: string; sku: string; sales: number };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) => {
  if (active && payload && payload.length) {
    const { name, sku, sales } = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{name}</div>
        <div>SKU: <span style={{ fontWeight: 600 }}>{sku}</span></div>
        <div>Vendidos: <span style={{ fontWeight: 600, color: '#ff9800' }}>{sales}</span></div>
      </div>
    );
  }
  return null;
};


const BarChartTopProducts: React.FC<Props> = ({ data }) => {
  // Truncar los nombres para el eje X
  const maxLabelLength = 13;
  const chartData = data.map(item => ({
    ...item,
    truncatedName: truncateLabel(item.name, maxLabelLength),
  }));

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Top 10 Productos Más Vendidos</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 30, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="truncatedName"
            tick={{ fontSize: 12, fill: '#1a1a1a', fontWeight: 500 }}
            angle={-90}
            textAnchor="end"
            height={160}
            interval={0}
            dy={95}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 13, fill: '#1a1a1a' }}
            label={{ value: 'Cantidad Vendida', angle: -90, position: 'insideLeft', fontSize: 13, fill: '#1a1a1a', offset: 10 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 152, 0, 0.1)' }} />
          <Bar dataKey="sales" radius={[6, 6, 0, 0]} barSize={36} label={{ position: 'top', fill: '#1a1a1a', fontWeight: 600 }}>
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={ORANGE_PALETTE[idx % ORANGE_PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartTopProducts;
