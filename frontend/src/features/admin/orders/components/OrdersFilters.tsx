// ─────────────────────────────────────────────────────────────────────────────
// OrdersFilters.tsx
// Barra de filtros simple (versión legacy). Recibe todos los valores y setters
// como props individuales desde el padre.
//

import { STATUS_OPTIONS, STATUS_LABELS } from '../utils/ordersHelpers';
import styles from '../AdminOrders.module.css';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';

/**
 * Props de la barra de filtros legacy.
 * Cada campo de filtro tiene su propio valor y setter independiente.
 * El padre es responsable de hacer debounce si lo necesita.
 */

interface OrdersFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  filterStatus: OrderStatus | '';
  setFilterStatus: (v: OrderStatus | '') => void;
  filterDateFrom: string;
  setFilterDateFrom: (v: string) => void;
  filterDateTo: string;
  setFilterDateTo: (v: string) => void;
  clearFilters: () => void;
  isLoading: boolean;
}

/**
 * OrdersFilters — barra de filtros para la tabla de pedidos (versión controlada).
 *
 * Renderiza:
 *  - Input de búsqueda libre (cliente, email o N° de pedido)
 *  - Select de estado (usa STATUS_OPTIONS del helper)
 *  - Rango de fechas (desde / hasta)
 *  - Botón "Limpiar" que aparece solo si hay algún filtro activo
 *
 * Todos los inputs se deshabilitan durante isLoading para evitar
 * cambios mientras hay un fetch en curso.
 */

export function OrdersFilters(props: OrdersFiltersProps) {
  const {
    search, setSearch, filterStatus, setFilterStatus,
    filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo,
    clearFilters, isLoading
  } = props;
  return (
    <div className={styles.filters}>
      {/* ── Búsqueda libre ── */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar por cliente, email o N° de pedido..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          disabled={isLoading}
          aria-label="Buscar pedidos"
        />
      </div>
      {/* ── Filtro por estado ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as OrderStatus | '')}
          disabled={isLoading}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {/* STATUS_OPTIONS define el orden canónico de los estados */}
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      {/* ── Rango de fechas ── */}
      <div className={styles.dateFilters} style={{ alignItems: 'center', gap: 4 }}>
        <label className={styles.dateLabel} htmlFor="order-date-from">Desde</label>
        <input
          className={styles.dateInput}
          id="order-date-from"
          type="date"
          value={filterDateFrom}
          onChange={e => setFilterDateFrom(e.target.value)}
          disabled={isLoading}
          aria-label="Filtrar desde fecha"
        />
        <label className={styles.dateLabel} htmlFor="order-date-to">Hasta</label>
        <input
          className={styles.dateInput}
          id="order-date-to"
          type="date"
          value={filterDateTo}
          onChange={e => setFilterDateTo(e.target.value)}
          disabled={isLoading}
          aria-label="Filtrar hasta fecha"
        />
      </div>
      {/*
        Botón "Limpiar": solo visible cuando hay algún filtro activo Y no
        estamos cargando. Evita confusión si el usuario lo presiona durante fetch.
      */}
      {!isLoading && (search || filterStatus || filterDateFrom || filterDateTo) && (
        <button
          className={styles.clearBtn}
          type="button"
          onClick={clearFilters}
          aria-label="Limpiar filtros"
        >
          ✕ Limpiar
        </button>
      )}
    </div>
  );
}
