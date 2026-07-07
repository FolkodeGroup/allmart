import React, { useMemo } from 'react';
import styles from '../../features/admin/products/AdminProducts.module.css';
import { Search } from 'lucide-react';
import type { StatusFilter, StockLevelFilter } from '../../features/admin/products/productsService';
import { Dropdown } from './Dropdown/Dropdown';

interface ProductFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: Array<{ id: string; name: string }>;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  stockLevelFilter: StockLevelFilter;
  setStockLevelFilter: (v: StockLevelFilter) => void;
  total: number;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  search,
  setSearch,
  inputRef,
  categoryFilter,
  setCategoryFilter,
  categories,
  statusFilter,
  setStatusFilter,
  stockLevelFilter,
  setStockLevelFilter,
  total,
}) => {
  // ── Mapeo de opciones para el Dropdown de Categorías ──
  const categoryOptions = useMemo(() => [
    { value: '', label: 'Todas las categorías' },
    ...categories.map(c => ({ value: c.id, label: c.name }))
  ], [categories]);

  // ── Mapeo de opciones para el Dropdown de Estados ──
  const statusOptions = useMemo(() => [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
  ], []);

  // ── Mapeo de opciones para el Dropdown de Stocks ──
  const stockOptions = useMemo(() => [
    { value: 'all', label: 'Todos los stocks' },
    { value: 'no_stock', label: 'Sin stock' },
    { value: 'low_stock', label: 'Stock bajo' },
    { value: 'in_stock', label: 'Con stock' }
  ], []);

  return (
    <nav className={styles.filters} aria-label="Filtros de productos">
      {/* Buscador full-width */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <label htmlFor="search-products" className="sr-only">Buscar productos</label>
          <input
            ref={inputRef}
            id="search-products"
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por nombre, SKU..."
            value={search}
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            autoCapitalize="off"
            onChange={e => {
              setSearch(e.target.value);
            }}
            aria-label="Buscar productos por nombre o SKU"
          />
          <span className={styles.count} aria-live="polite">{total} productos</span>
        </div>
      </div>

      {/* Filtros Unificados con el componente Custom Dropdown */}
      <div className={styles.filtersRow} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', minWidth: '200px', maxWidth: '300px' }}>
          <span className="sr-only">Filtrar por categoría</span>
          <Dropdown
            id="category-filter"
            options={categoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Todas las categorías"
          />
        </div>

        <div style={{ flex: '1 1 160px', minWidth: '160px', maxWidth: '220px' }}>
          <span className="sr-only">Filtrar por estado</span>
          <Dropdown
            id="status-filter"
            options={statusOptions}
            value={statusFilter}
            onChange={val => setStatusFilter(val as StatusFilter)}
            placeholder="Todos los estados"
          />
        </div>

        <div style={{ flex: '1 1 160px', minWidth: '160px', maxWidth: '220px' }}>
          <span className="sr-only">Filtrar por stock</span>
          <Dropdown
            id="stock-filter"
            options={stockOptions}
            value={stockLevelFilter}
            onChange={val => setStockLevelFilter(val as StockLevelFilter)}
            placeholder="Todos los stocks"
          />
        </div>
      </div>
    </nav>
  );
};