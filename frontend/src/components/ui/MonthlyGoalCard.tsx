import { useState } from 'react';

interface MonthlyGoalCardProps {
  currentMonthRevenue: number;
  monthlyGoal: number;
  onSaveGoal: (value: number) => void;
  styles: Record<string, string>;
}

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

/**
 * MonthlyGoalCard
 * Tarjeta del objetivo mensual con edición inline.
 * Encapsula su propio estado de edición para no contaminar al dashboard.
 * Recibe `styles` como prop para usar las clases CSS del módulo del consumidor.
 */
export function MonthlyGoalCard({
  currentMonthRevenue,
  monthlyGoal,
  onSaveGoal,
  styles,
}: MonthlyGoalCardProps) {
  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const goalProgress = Math.min(100, monthlyGoal === 0 ? 0 : (currentMonthRevenue / monthlyGoal) * 100);

  const handleSave = () => {
    const val = Math.max(0, Number(goalInput) || 0);
    onSaveGoal(val);
    setEditing(false);
  };

  return (
    <div className={styles.goalCard}>
      <div className={styles.goalHeader}>
        <h4 className={styles.chartTitle}>Objetivo Mensual</h4>
        <button
          className={styles.goalEditBtn}
          onClick={() => { setGoalInput(String(monthlyGoal)); setEditing(true); }}
          title="Editar objetivo"
        >
          ✏️
        </button>
      </div>
      {editing ? (
        <div className={styles.goalEditForm}>
          <input
            type="number"
            className={styles.goalEditInput}
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            min={0}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <button className={styles.goalEditSave} onClick={handleSave}>Guardar</button>
          <button className={styles.goalEditCancel} onClick={() => setEditing(false)}>Cancelar</button>
        </div>
      ) : (
        <div className={styles.goalValue}>
          {fmt(currentMonthRevenue)}
          <span className={styles.goalTarget}> / {fmt(monthlyGoal)}</span>
        </div>
      )}
      <div className={styles.goalBarOuter}>
        <div className={styles.goalBarInner} style={{ width: `${goalProgress}%` }} />
      </div>
      <span className={styles.goalPercent}>{goalProgress.toFixed(1)}% completado</span>
    </div>
  );
}
