// src/features/admin/orders/components/OrdersFiltersBar.tsx
import type { OrdersFiltersState } from '../hooks/useOrdersFilters';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';
import styles from '../AdminOrders.module.css';
import { Search } from 'lucide-react';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker';

const STATUS_OPTIONS: OrderStatus[] = [
    'pendiente', 'confirmado', 'en-preparacion', 'enviado', 'entregado', 'cancelado',
];
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
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            id="order-search"
                            type="text"
                            placeholder="Buscar por cliente, email..."
                            value={filters.search}
                            onChange={e => onChange({ ...filters, search: e.target.value })}
                            disabled={disabled}
                            autoComplete="off"
                        />
                    </div>
                </div>

                {/* Select Unificado de Estado */}
                <div className={styles.filterSelectWrap}>
                    <label className={styles.dateLabel} htmlFor="order-status">Estado</label>
                    <select
                        className="unified-select"
                        id="order-status"
                        value={filters.status}
                        onChange={e => onChange({ ...filters, status: e.target.value as OrderStatus | '' })}
                        disabled={disabled}
                    >
                        <option value="">Todos los estados</option>
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                    </select>
                </div>

                {/* Calendarios Customizados (DatePicker) */}
                <div className={styles.dateFilters}>
                    <div className={styles.dateFiltersSeparation}>
                        <span className={styles.dateLabel}>Desde</span>
                        <DatePicker
                            id="order-date-from"
                            value={filters.dateFrom}
                            onChange={val => onChange({ ...filters, dateFrom: val })}
                            disabled={disabled}
                        />
                    </div>
                    <div className={styles.dateFiltersSeparation}>
                        <span className={styles.dateLabel}>Hasta</span>
                        <DatePicker
                            id="order-date-to"
                            value={filters.dateTo}
                            onChange={val => onChange({ ...filters, dateTo: val })}
                            disabled={disabled}
                        />
                    </div>
                </div>

                {/* Rango de Total */}
                <div className={styles.totalFilters}>
                    <div className={styles.totalFiltersSeparation}>
                        <label className={styles.totalLabel} htmlFor="order-total-min">$ Mín</label>
                        <input
                            className={styles.totalInput}
                            id="order-total-min"
                            type="number"
                            min={0}
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
                            placeholder="Sin límite"
                            value={filters.totalMax}
                            onChange={e => onChange({ ...filters, totalMax: e.target.value })}
                            disabled={disabled}
                        />
                    </div>
                </div>

                {hasActiveFilters && (
                    <button className={styles.clearBtn} type="button" onClick={onReset} aria-label="Limpiar filtros">
                        ✕ Limpiar
                    </button>
                )}
            </div>
        </div>
    );
}