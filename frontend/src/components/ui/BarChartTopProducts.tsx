import React, { useState, useEffect } from 'react';
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
  'var(--color-accent, #DDB08C)',
  '#ffb347', '#ffcc80', '#ff9800', '#ffa726', '#ff7043', '#ffab91', '#ff6f00', '#ff8a65', '#ffd180',
];

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

  const maxLabelLength = isMobile ? 10 : 13;
  const chartData = data.map(item => ({
    ...item,
    truncatedName: truncateLabel(item.name, maxLabelLength),
  }));

  const maxSales = Math.max(...data.map(d => d.sales), 1);
  const topMobileData = data.slice(0, 5);

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Top Productos Más Vendidos</h2>

      {/* Vista de Gráfico Escritorio (>= 768px) */}
      <div className={styles.chartDesktop}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 30, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="truncatedName"
              tick={{ fontSize: 12, fill: 'var(--color-text-primary, #ffffff)', fontWeight: 500 }}
              angle={-90}
              textAnchor="end"
              height={160}
              interval={0}
              dy={95}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 13, fill: 'var(--color-text-primary, #ffffff)' }}
              label={{ value: 'Cantidad Vendida', angle: -90, position: 'insideLeft', fontSize: 13, fill: 'var(--color-text-primary, #ffffff)', offset: 10 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 152, 0, 0.1)' }} />
            <Bar dataKey="sales" radius={[6, 6, 0, 0]} barSize={36} label={{ position: 'top', fill: 'var(--color-text-primary, #ffffff)', fontWeight: 600 }}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={ORANGE_PALETTE[idx % ORANGE_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vista Móvil: Lista táctica de los Top 5 con barras de progreso */}
      <div className={styles.mobileRankList}>
        {topMobileData.map((item, idx) => {
          const percent = Math.min(100, Math.round((item.sales / maxSales) * 100));
          return (
            <div key={item.sku || idx} className={styles.mobileRankItem}>
              <div className={styles.mobileRankMeta}>
                <span className={styles.mobileRankNumber}>#{idx + 1}</span>
                <div className={styles.mobileRankInfo}>
                  <span className={styles.mobileRankName}>{item.name}</span>
                  {item.sku && <span className={styles.mobileRankSku}>SKU: {item.sku}</span>}
                </div>
                <span className={styles.mobileRankValue}>{item.sales} un.</span>
              </div>
              <div className={styles.mobileRankBarOuter}>
                <div
                  className={styles.mobileRankBarInner}
                  style={{
                    width: `${percent}%`,
                    backgroundColor: ORANGE_PALETTE[idx % ORANGE_PALETTE.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChartTopProducts;