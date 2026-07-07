import React, { useMemo } from 'react';
import styles from '../AdminReports.module.css';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

export type PredefinedPeriod = '7d' | '30d' | '90d' | 'all';

export interface DateRange {
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
}

export type ReportsFiltersValue =
    | { type: 'predefined'; period: PredefinedPeriod; status?: string[]; clientQuery?: string; productQuery?: string }
    | { type: 'custom'; range: DateRange; status?: string[]; clientQuery?: string; productQuery?: string };

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
}) => {
    const isCustom = value.type === 'custom';
    const isMobile = useIsMobile();

    const handlePeriodClick = (period: PredefinedPeriod) => {
        onChange({ type: 'predefined', period });
    };

    // Mapeo de opciones de período para el Dropdown unificado
    const periodOptions = useMemo(() => [
        { value: '7d', label: 'Últimos 7 días' },
        { value: '30d', label: 'Últimos 30 días' },
        { value: '90d', label: 'Últimos 90 días' },
        { value: 'all', label: 'Todo el tiempo' }
    ], []);

    // Handler específico para procesar el string directo devuelto por el DatePicker
    const handleDatePickerChange = (name: 'from' | 'to', dateValue: string) => {
        const prevRange = value.type === 'custom' ? value.range : { from: '', to: '' };

        if (value.type === 'custom') {
            onChange({
                ...value,
                range: { ...value.range, [name]: dateValue },
            });
        } else {
            onChange({
                type: 'custom',
                range: {
                    from: name === 'from' ? dateValue : prevRange.from,
                    to: name === 'to' ? dateValue : prevRange.to,
                },
                status: value.status,
                clientQuery: value.clientQuery,
                productQuery: value.productQuery,
            });
        }
    };

    if (isMobile) {
        return (
            <div className={styles.filtersBarMobile}>
                <span className={styles.filtersLabel}>Filtros</span>
                <div style={{ width: '100%' }}>
                    <Dropdown
                        options={periodOptions}
                        value={value.type === 'predefined' ? value.period : ''}
                        onChange={val => onChange({ type: 'predefined', period: val as PredefinedPeriod })}
                        placeholder="Seleccionar período"
                    />
                </div>
                <div className={styles.filtersDatesMobile}>
                    <span className={styles.filtersLabel}>Desde:</span>
                    <DatePicker
                        value={isCustom ? value.range.from : ''}
                        onChange={val => handleDatePickerChange('from', val)}
                    />
                    <span className={styles.filtersLabel}>Hasta:</span>
                    <DatePicker
                        value={isCustom ? value.range.to : ''}
                        onChange={val => handleDatePickerChange('to', val)}
                    />
                </div>
            </div>
        );
    }

    // Desktop layout
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
                <div className={styles.rangeLabel}>
                    <span>Desde</span>
                    <DatePicker
                        value={isCustom ? value.range.from : ''}
                        onChange={val => handleDatePickerChange('from', val)}
                    />
                </div>
                <span className={styles.rangeSeparator}>—</span>
                <div className={styles.rangeLabel}>
                    <span>Hasta</span>
                    <DatePicker
                        value={isCustom ? value.range.to : ''}
                        onChange={val => handleDatePickerChange('to', val)}
                    />
                </div>
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