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

function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= 600 : false
    );
    React.useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

export const ReportsFilters: React.FC<ReportsFiltersProps> = ({
    value,
    onChange,
    minDate,
    maxDate,
}) => {
    const isCustom = value.type === 'custom';
    const isMobile = useIsMobile();

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

    if (isMobile) {
        return (
            <div className={styles.filtersBarMobile}>
                <span className={styles.filtersLabel}>Filtros</span>
                <select
                    className={styles.filtersSelectMobile}
                    value={value.type === 'predefined' ? value.period : ''}
                    onChange={e => onChange({ type: 'predefined', period: e.target.value as PredefinedPeriod })}
                >
                    <option value="7d">Últimos 7 días</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="90d">Últimos 90 días</option>
                    <option value="all">Todo el tiempo</option>
                </select>
                <div className={styles.filtersDatesMobile}>
                    <span className={styles.filtersLabel}>Desde:</span>
                    <input
                        type="date"
                        name="from"
                        value={isCustom ? value.range.from : ''}
                        onChange={handleDateChange}
                        min={minDate}
                        max={maxDate}
                        className={styles.dateInputMobile}
                    />
                    <span className={styles.filtersLabel}>Hasta:</span>
                    <input
                        type="date"
                        name="to"
                        value={isCustom ? value.range.to : ''}
                        onChange={handleDateChange}
                        min={minDate}
                        max={maxDate}
                        className={styles.dateInputMobile}
                    />
                </div>
            </div>
        );
    }

    // Desktop layout (igual que antes)
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
