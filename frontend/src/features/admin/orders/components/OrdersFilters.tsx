import { STATUS_OPTIONS, STATUS_LABELS } from '../utils/ordersHelpers';
import styles from '../AdminOrders.module.css';
import { Tooltip } from '../../../../components/ui/Tooltip/Tooltip';
import type { OrderStatus } from '../../../../context/AdminOrdersContext';

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

export function OrdersFilters(props: OrdersFiltersProps) {
  const {
    search, setSearch, filterStatus, setFilterStatus,
    filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo,
    clearFilters, isLoading
  } = props;
  return (
    <div className={styles.filters}>
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
        <Tooltip content="Buscá pedidos por nombre, email o número de pedido.">
          <button
            type="button"
            aria-label="Ayuda búsqueda"
            style={{ background: 'none', border: 'none', marginLeft: 4, cursor: 'pointer', color: '#2563eb', fontSize: 18 }}
            tabIndex={0}
          >
          </button>
        </Tooltip>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as OrderStatus | '')}
          disabled={isLoading}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <Tooltip content="Filtrá los pedidos por estado (pendiente, confirmado, etc).">
          <button
            type="button"
            aria-label="Ayuda filtro estado"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 18 }}
            tabIndex={0}
          >
          </button>
        </Tooltip>
      </div>
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
        <Tooltip content="Filtrá los pedidos por rango de fechas.">
          <button
            type="button"
            aria-label="Ayuda filtro fechas"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 18 }}
            tabIndex={0}
          >
          </button>
        </Tooltip>
      </div>
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
