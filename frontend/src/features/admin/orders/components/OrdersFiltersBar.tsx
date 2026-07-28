// src/features/admin/orders/components/OrdersFiltersBar.tsx
import { useMemo } from 'react';
import type { OrdersFiltersState } from '../hooks/useOrdersFilters';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';
import { STATUS_OPTIONS, STATUS_LABELS } from '../utils/ordersHelpers';
import styles from '../AdminOrders.module.css';
import { Search } from 'lucide-react';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

interface Props {
    filters: OrdersFiltersState;
    onChange: (filters: OrdersFiltersState) => void;
    onReset: () => void;
    hasActiveFilters: boolean;
    disabled?: boolean;
}

export function OrdersFiltersBar({ filters, onChange, onReset, hasActiveFilters, disabled }: Props) {
    const isDisabled = disabled ?? false;

    // ── Mapeo de opciones para el Dropdown unificado de Estados ──
    const dropdownOptions = useMemo(() => [
        { value: '', label: 'Todos los estados' },
        ...STATUS_OPTIONS.map(s => ({
            value: s,
            label: STATUS_LABELS[s]
        }))
    ], []);

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
                            disabled={isDisabled}
                            autoComplete="off"
                        />
                    </div>
                </div>

                {/* Dropdown Unificado de Estado */}
                <div className={styles.filterSelectWrap} style={{ minWidth: '180px' }}>
                    <span className={styles.dateLabel}>Estado</span>
                    <Dropdown
                        id="order-status"
                        options={dropdownOptions}
                        value={filters.status}
                        onChange={val => onChange({ ...filters, status: val as OrderStatus | '' })}
                        disabled={isDisabled}
                        placeholder="Todos los estados"
                    />
                </div>

                {/* Calendarios Customizados (DatePicker) */}
                <div className={styles.dateFilters}>
                    <div className={styles.dateFiltersSeparation}>
                        <span className={styles.dateLabel}>Desde</span>
                        <DatePicker
                            id="order-date-from"
                            value={filters.dateFrom}
                            onChange={val => onChange({ ...filters, dateFrom: val })}
                            disabled={isDisabled}
                        />
                    </div>
                    <div className={styles.dateFiltersSeparation}>
                        <span className={styles.dateLabel}>Hasta</span>
                        <DatePicker
                            id="order-date-to"
                            value={filters.dateTo}
                            onChange={val => onChange({ ...filters, dateTo: val })}
                            disabled={isDisabled}
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
                            disabled={isDisabled}
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
                            disabled={isDisabled}
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