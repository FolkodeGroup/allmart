import React from 'react';
import styles from '../AdminReports.module.css';

export type PredefinedPeriod = '7d' | '30d' | '90d' | 'all';

export interface DateRange {
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
}

export type ReportsFiltersValue =
    | ({ type: 'predefined'; period: PredefinedPeriod }
        | { type: 'custom'; range: DateRange }) & {
            status?: string[];
            clientQuery?: string;
            productQuery?: string;
        };

interface ReportsFiltersProps {
    value: ReportsFiltersValue;
    onChange: (value: ReportsFiltersValue) => void;
    minDate?: string;
    maxDate?: string;
}

const PERIOD_LABELS: Record<PredefinedPeriod, string> = {
    '7d': 'Últimos 7 días',
    '30d': 'Últimos 30 días',
    '90d': 'Últimos 90 días',
    'all': 'Todo el tiempo',
};

/**
 * Componente de filtros avanzados para reportes.
 *
 * Permite seleccionar periodo, rango de fechas y aplicar filtros por estado, cliente y producto.
 *
 * @param value Estado actual de los filtros
 * @param onChange Callback para actualizar filtros
 * @param minDate Fecha mínima permitida
 * @param maxDate Fecha máxima permitida
 */
export const ReportsFilters: React.FC<ReportsFiltersProps> = ({
    value,
    onChange,
    minDate,
    maxDate,
}) => {
    const isCustom = value.type === 'custom';

    const handlePeriodClick = (period: PredefinedPeriod) => {
        onChange({ type: 'predefined', period });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value: dateValue } = e.target;
        if (value.type === 'custom') {
            const range = { ...value.range, [name]: dateValue };
            onChange({ type: 'custom', range });
        } else {
            // Switch to custom if user starts editing
            onChange({ type: 'custom', range: { from: '', to: '' } });
        }
    };

    return (
        <div className={styles.filtersBar}>
            <div className={styles.periodTabs}>
                {(Object.keys(PERIOD_LABELS) as PredefinedPeriod[]).map((p) => (
                    <button
                        key={p}
                        type="button"
                        className={
                            value.type === 'predefined' && value.period === p
                                ? `${styles.periodTab} ${styles.periodTabActive}`
                                : styles.periodTab
                        }
                        onClick={() => handlePeriodClick(p)}
                    >
                        {PERIOD_LABELS[p]}
                    </button>
                ))}
            </div>
            <div className={styles.customRangeWrap}>
                <label className={styles.rangeLabel}>
                    Desde
                    <input
                        type="date"
                        name="from"
                        value={isCustom ? value.range.from : ''}
                        onChange={handleDateChange}
                        min={minDate}
                        max={maxDate}
                        className={styles.dateInput}
                    />
                </label>
                <span className={styles.rangeSeparator}>—</span>
                <label className={styles.rangeLabel}>
                    Hasta
                    <input
                        type="date"
                        name="to"
                        value={isCustom ? value.range.to : ''}
                        onChange={handleDateChange}
                        min={minDate}
                        max={maxDate}
                        className={styles.dateInput}
                    />
                </label>
                <button
                    type="button"
                    className={isCustom ? styles.clearBtn : styles.clearBtnDisabled}
                    onClick={() => onChange({ ...value, type: 'predefined', period: '30d' })}
                    disabled={!isCustom}
                    title="Limpiar filtro personalizado"
                >
                    Limpiar
                </button>
            </div>
        </div>

    );
};
