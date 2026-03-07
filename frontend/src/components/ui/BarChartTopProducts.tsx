
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import styles from './BarChartTopProducts.module.css';


export interface TopProductData {
  name: string;
  sku: string;
  sales: number;
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
export function truncateLabel(text: string, maxLength: number = 13): string {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}


const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, sku, sales } = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <div><strong>{name}</strong></div>
        <div>SKU: <span>{sku}</span></div>
        <div>Vendidos: <span>{sales}</span></div>
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
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="truncatedName"
            tick={{ fontSize: 12, fill: '#000000', fontWeight: 500 }}
            angle={0}
            textAnchor="middle"
            interval={0}
            height={50}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 13 }}
            label={{ value: 'Cantidad Vendida', angle: -90, position: 'insideLeft', fontSize: 14, fill: '#000000' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
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
