import React from 'react';
// ...existing code...
import styles from './SalesActivityHeatmap.module.css';

export interface SalesActivityHeatmapProps {
  // Matriz: [día][hora] = cantidad de ventas
  data: number[][];
  dayLabels: string[];
  hourLabels: string[];
}

// Escala de color: claro → naranja (paleta Allmart)
function getCellColor(value: number, max: number) {
  if (max === 0 || value === 0) return 'var(--color-bg-tertiary)';
  const t = value / max;
  // Paleta naranja mejorada: light → accent → dark
  // #f4d5b8 (light), #ff9800 (accent), #d97706 (dark)
  const colors = [
    [244, 213, 184], // light
    [255, 152, 0],   // accent
    [217, 119, 6],   // dark
  ];
  let r, g, b;
  if (t < 0.5) {
    // Interpolar light → accent
    const f = t / 0.5;
    r = Math.round(colors[0][0] + (colors[1][0] - colors[0][0]) * f);
    g = Math.round(colors[0][1] + (colors[1][1] - colors[0][1]) * f);
    b = Math.round(colors[0][2] + (colors[1][2] - colors[0][2]) * f);
  } else {
    // Interpolar accent → dark
    const f = (t - 0.5) / 0.5;
    r = Math.round(colors[1][0] + (colors[2][0] - colors[1][0]) * f);
    g = Math.round(colors[1][1] + (colors[2][1] - colors[1][1]) * f);
    b = Math.round(colors[1][2] + (colors[2][2] - colors[1][2]) * f);
  }
  return `rgb(${r},${g},${b})`;
}

// Determina si el texto debe ser blanco o negro basado en el brillo del fondo
function getTextColor(value: number, max: number): string {
  if (max === 0 || value === 0) return '#666';
  const t = value / max;
  // Si es más del 40% de brillo, usa texto oscuro
  return t > 0.4 ? '#ffffff' : '#1a1a1a';
}

const SalesActivityHeatmap: React.FC<SalesActivityHeatmapProps> = ({ data, dayLabels, hourLabels }) => {
  const max = Math.max(...data.flat());
  // Grid: (1 + horas) cols x (1 + días) rows
  return (
    <div className={styles.heatmapCard}>
      <h2 className={styles.heatmapTitle}>Actividad de Ventas por Día y Hora</h2>
      <div
        className={styles.heatmapGrid}
        style={{
          display: 'grid',
          gridTemplateColumns: `minmax(2.5rem,auto) repeat(${hourLabels.length}, 2.2rem)`,
          gridTemplateRows: `minmax(1.8rem,auto) repeat(${dayLabels.length}, 2.2rem)`,
          gap: '0.2rem',
        }}
      >
        {/* Esquina vacía */}
        <div className={styles.heatmapCorner} style={{ gridRow: 1, gridColumn: 1 }}></div>
        {/* Header de horas */}
        {hourLabels.map((h, idx) => (
          <div
            key={h}
            className={styles.heatmapHour}
            style={{ gridRow: 1, gridColumn: idx + 2 }}
          >
            {h}
          </div>
        ))}
        {/* Días y celdas */}
        {dayLabels.map((day, dayIdx) => (
          <React.Fragment key={day}>
            {/* Día (eje Y) */}
            <div
              className={styles.heatmapDay}
              style={{ gridRow: dayIdx + 2, gridColumn: 1 }}
            >
              {day}
            </div>
            {/* Celdas de la fila */}
            {hourLabels.map((h, hourIdx) => (
              <div
                key={h + '-' + day}
                className={styles.heatmapCell}
                style={{
                  background: getCellColor(data[dayIdx][hourIdx], max),
                  gridRow: dayIdx + 2,
                  gridColumn: hourIdx + 2,
                }}
                title={`${day}, ${h}: ${data[dayIdx][hourIdx]} pedidos`}
              >
                {data[dayIdx][hourIdx] > 0 ? (
                  <span
                    className={styles.heatmapValue}
                    style={{ color: getTextColor(data[dayIdx][hourIdx], max) }}
                  >
                    {data[dayIdx][hourIdx]}
                  </span>
                ) : null}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SalesActivityHeatmap;
