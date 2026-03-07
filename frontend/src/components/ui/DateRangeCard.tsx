// ...existing code...
import styles from './DateRangeCard.module.css';

interface DateRange {
  from: string; // yyyy-mm-dd
  to: string;  // yyyy-mm-dd
}

interface DateRangeCardProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangeCard({ value, onChange }: DateRangeCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>📅</span>
        <span className={styles.title}>Filtrar por rango de fechas</span>
      </div>
      <div className={styles.inputsRow}>
        <label className={styles.label}>
          Desde
          <input
            className={styles.input}
            type="date"
            value={value.from}
            max={value.to}
            onChange={e => onChange({ ...value, from: e.target.value })}
          />
        </label>
        <label className={styles.label}>
          Hasta
          <input
            className={styles.input}
            type="date"
            value={value.to}
            min={value.from}
            onChange={e => onChange({ ...value, to: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
