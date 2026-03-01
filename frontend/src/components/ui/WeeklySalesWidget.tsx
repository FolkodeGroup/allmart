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

const WeeklySalesWidget: React.FC<WeeklySalesWidgetProps> = ({ data, totalSales }) => {
  return (
    <div className={styles['weekly-sales-widget-card']}>
      <div className={styles['weekly-sales-widget-header']}>
        <h2>Ventas - Últimos 7 días</h2>
        <div className={styles['weekly-sales-widget-total']}>Total: <strong>{totalSales}</strong></div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip contentStyle={{ fontSize: 14 }} formatter={(value: number | undefined) => [`${value ?? 0} ventas`, 'Ventas']} />
          <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" isAnimationActive={true} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklySalesWidget;
