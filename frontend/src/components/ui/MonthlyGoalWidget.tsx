import { useState } from 'react';
import styles from './MonthlyGoalWidget.module.css';

interface MonthlyGoalWidgetProps {
  ventasDelMes: number;
}

export default function MonthlyGoalWidget({ ventasDelMes }: MonthlyGoalWidgetProps) {
  const [meta, setMeta] = useState(ventasDelMes > 0 ? Math.ceil(ventasDelMes * 1.2) : 100000);
  const porcentaje = meta > 0 ? Math.min(100, (ventasDelMes / meta) * 100) : 0;

  return (
    <div className={styles.widget}>
      <h3 className={styles.title}>Objetivos Mensuales</h3>
      <div className={styles.content}>
        <div className={styles.progressContainer}>
          <svg className={styles.progressCircle} width="90" height="90" viewBox="0 0 90 90">
            <circle
              className={styles.bg}
              cx="45" cy="45" r="38"
              strokeWidth="6"
              fill="none"
            />
            <circle
              className={styles.fg}
              cx="45" cy="45" r="38"
              strokeWidth="6"
              fill="none"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={2 * Math.PI * 38 * (1 - porcentaje / 100)}
            />
            <text x="45" y="52" textAnchor="middle" className={styles.percentText}>
              {Math.round(porcentaje)}%
            </text>
          </svg>
        </div>
        <div className={styles.inputContainer}>
          <label htmlFor="metaMensual" className={styles.label}>Meta ARS</label>
          <input
            id="metaMensual"
            type="number"
            min={ventasDelMes}
            className={styles.input}
            value={meta}
            onChange={e => setMeta(Number(e.target.value))}
          />
        </div>
      </div>
      <div className={styles.ventasInfo}>
        Ventas del mes: <span className={styles.ventas}>{ventasDelMes.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}</span>
      </div>
    </div>
  );
}
