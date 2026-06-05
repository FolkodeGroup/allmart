import React from 'react';
import styles from '../../features/admin/products/AdminProducts.module.css';
import { Search } from 'lucide-react';
import type { StatusFilter, StockLevelFilter } from '../../features/admin/products/productsService';

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
}) => (
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

    {/* Filtros */}
    <div className={styles.filtersRow}>
      <label htmlFor="category-filter" className="sr-only">Filtrar por categoría</label>
      <select
        id="category-filter"
        className={styles.select}
        value={categoryFilter}
        onChange={e => setCategoryFilter(e.target.value)}
        aria-label="Filtrar por categoría"
      >
        <option value="">Todas las categorías</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <label htmlFor="status-filter" className="sr-only">Filtrar por estado</label>
      <select
        id="status-filter"
        className={styles.select}
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value as StatusFilter)}
        aria-label="Filtrar por estado"
      >
        <option value="all">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>

      <label htmlFor="stock-filter" className="sr-only">Filtrar por stock</label>
      <select
        id="stock-filter"
        className={styles.select}
        value={stockLevelFilter}
        onChange={e => setStockLevelFilter(e.target.value as StockLevelFilter)}
        aria-label="Filtrar por stock"
      >
        <option value="all">Todos los stocks</option>
        <option value="no_stock">Sin stock</option>
        <option value="low_stock">Stock bajo</option>
        <option value="in_stock">Con stock</option>
      </select>
    </div>
  </nav>
);
