import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './WeeklySalesWidget.module.css';

export type WeeklySalesData = {
  day: string;
  sales: number;
};

export interface WeeklySalesWidgetProps {
  data: WeeklySalesData[];
  totalSales: number;
}

interface TooltipPayloadEntry {
  payload: WeeklySalesData;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) => {
  if (active && payload && payload.length) {
    const { day, sales } = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{day}</div>
        <div>Ventas: <span style={{ fontWeight: 600, color: '#ff9800' }}>{sales}</span></div>
      </div>
    );
  }
  return null;
};

const WeeklySalesWidget: React.FC<WeeklySalesWidgetProps> = ({ data, totalSales }) => {
  return (
    <div className={styles['weekly-sales-widget-card']}>
      <div className={styles['weekly-sales-widget-header']}>
        <h2>Ventas - Últimos 7 días</h2>
        <div className={styles['weekly-sales-widget-total']}>Total: <strong>{totalSales}</strong></div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ff9800" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: '#1a1a1a', fontWeight: 500 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#1a1a1a' }}
            label={{ value: 'Ventas', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#1a1a1a' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 152, 0, 0.1)' }} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#ff9800"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSales)"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklySalesWidget;
