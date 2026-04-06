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

        <div className={styles.filtersWrap}>
            <div>
                <h2 className={styles.filtersTitle}>Filtros</h2>
            </div>
            <div className={styles.filtersControls}>
                <div className={styles.searchWrap}>
                    <label className={styles.dateLabel} htmlFor="order-search">Buscar</label>
                    <div className={styles.searchInputWrap}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            className={styles.searchInput}
                            id="order-search"
                            type="text"
                            placeholder="Buscar por cliente, email o N° de pedido..."
                            value={filters.search}
                            onChange={e => onChange({ ...filters, search: e.target.value })}
                            disabled={disabled}
                            aria-label="Buscar pedidos"
                        />
                    </div>
                </div>

                <StatusChipSelect
                    options={STATUS_OPTIONS.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                    selected={filters.statuses}
                    onChange={statuses => onChange({ ...filters, statuses })}
                    placeholder="Todos los estados"
                    selectClassName={styles.filterSelect}
                    label='Estado'
                    labelClassName={styles.dateLabel}
                    chipClassName={styles.chip}
                    chipCloseClassName={styles.chipClose}
                />

                <div className={styles.dateFilters}>
                    <div className={styles.dateFiltersSeparation}>
                        <label className={styles.dateLabel} htmlFor="order-date-from">Desde</label>
                        <input
                            className={styles.dateInput}
                            id="order-date-from"
                            type="date"
                            value={filters.dateFrom}
                            onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                            disabled={disabled}
                            aria-label="Filtrar desde fecha"
                        />
                    </div>
                    <div className={styles.dateFiltersSeparation}>
                        <label className={styles.dateLabel} htmlFor="order-date-to">Hasta</label>
                        <input
                            className={styles.dateInput}
                            id="order-date-to"
                            type="date"
                            value={filters.dateTo}
                            onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                            disabled={disabled}
                            aria-label="Filtrar hasta fecha"
                        />
                    </div>
                </div>

                <div className={styles.totalFilters}>
                    <div className={styles.totalFiltersSeparation}>
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
                    </div>
                    <div className={styles.totalFiltersSeparation}>
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
                </div>

                {
                    hasActiveFilters && (
                        <button className={styles.clearBtn} type="button" onClick={onReset} aria-label="Limpiar filtros">
                            ✕ Limpiar
                        </button>
                    )
                }
            </div>
        </div >
    );
}