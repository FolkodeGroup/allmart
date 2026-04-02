// components/OrdersFiltersBar.tsx
import { StatusChipSelect } from './StatusChipSelect';
import type { OrdersFiltersState } from '../hooks/useOrdersFilters';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';
import styles from '../AdminOrders.module.css';

const STATUS_OPTIONS: OrderStatus[] = [
    'pendiente', 'confirmado', 'en-preparacion', 'enviado', 'entregado', 'cancelado',
];; // los mismos de siempre
const STATUS_LABELS = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    'en-preparacion': 'En preparación',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
} as Record<OrderStatus, string>;

interface Props {
    filters: OrdersFiltersState;
    onChange: (filters: OrdersFiltersState) => void;
    onReset: () => void;
    hasActiveFilters: boolean;
    disabled?: boolean;
}

export function OrdersFiltersBar({ filters, onChange, onReset, hasActiveFilters, disabled }: Props) {
    return (
        <div className={styles.filters}>
            <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Buscar por cliente, email o N° de pedido..."
                    value={filters.search}
                    onChange={e => onChange({ ...filters, search: e.target.value })}
                    disabled={disabled}
                />
            </div>

            <StatusChipSelect
                options={STATUS_OPTIONS.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                selected={filters.statuses}
                onChange={statuses => onChange({ ...filters, statuses })}
                placeholder="Todos los estados"
                selectClassName={styles.filterSelect}
                chipClassName={styles.chip}
                chipCloseClassName={styles.chipClose}
            />

            <div className={styles.dateFilters}>
                <label className={styles.dateLabel} htmlFor="order-date-from">Desde</label>
                <input
                    className={styles.dateInput}
                    id="order-date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                    disabled={disabled}
                />
                <label className={styles.dateLabel} htmlFor="order-date-to">Hasta</label>
                <input
                    className={styles.dateInput}
                    id="order-date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                    disabled={disabled}
                />
            </div>

            <div className={styles.totalFilters}>
                <label className={styles.totalLabel} htmlFor="order-total-min">$ Mín</label>
                <input
                    className={styles.totalInput}
                    id="order-total-min"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={filters.totalMin}
                    onChange={e => onChange({ ...filters, totalMin: e.target.value })}
                    disabled={disabled}
                />
                <label className={styles.totalLabel} htmlFor="order-total-max">$ Máx</label>
                <input
                    className={styles.totalInput}
                    id="order-total-max"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="Sin límite"
                    value={filters.totalMax}
                    onChange={e => onChange({ ...filters, totalMax: e.target.value })}
                    disabled={disabled}
                />
            </div>

            {hasActiveFilters && (
                <button className={styles.clearBtn} type="button" onClick={onReset}>
                    ✕ Limpiar
                </button>
            )}
        </div>
    );
}