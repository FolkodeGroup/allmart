import React from 'react';
import styles from '../../features/admin/products/AdminProducts.module.css';
import { Search } from 'lucide-react';
import type { StatusFilter, StockLevelFilter } from '../../features/admin/products/productsService';

interface ProductFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (v: (i: number) => number) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  suggestions: Array<{ id: string; name: string; sku: string }>;
  onSelectSuggestion: (name: string) => void;
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
  showSuggestions,
  setShowSuggestions,
  highlightedIndex,
  setHighlightedIndex,
  inputRef,
  suggestions,
  onSelectSuggestion,
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
          onChange={e => {
            setSearch(e.target.value);
            setShowSuggestions(true);
            setHighlightedIndex(() => -1);
          }}
          onFocus={() => search && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
          onKeyDown={e => {
            if (!showSuggestions || suggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              setHighlightedIndex(i => (i < suggestions.length - 1 ? i + 1 : 0));
              e.preventDefault();
            } else if (e.key === 'ArrowUp') {
              setHighlightedIndex(i => (i > 0 ? i - 1 : suggestions.length - 1));
              e.preventDefault();
            } else if ((e.key === 'Enter' || e.key === ' ') && highlightedIndex >= 0) {
              onSelectSuggestion(suggestions[highlightedIndex].name);
              setShowSuggestions(false);
              setHighlightedIndex(() => -1);
              inputRef.current?.blur();
              setTimeout(() => inputRef.current?.focus(), 0);
              e.preventDefault();
            }
          }}
          aria-label="Buscar productos por nombre o SKU"
          aria-autocomplete="list"
          aria-controls="suggestions-list"
          aria-activedescendant={highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined}
        />
        <span className={styles.count} aria-live="polite">{total} productos</span>

        {showSuggestions && suggestions.length > 0 && (
          <ul
            id="suggestions-list"
            className={styles.suggestionsList}
            role="listbox"
            aria-label="Sugerencias de productos"
          >
            {suggestions.map((s, idx) => (
              <li
                key={s.id}
                id={`suggestion-${idx}`}
                className={`${styles.suggestionItem} ${idx === highlightedIndex ? styles.suggestionActive : ''}`}
                role="option"
                aria-selected={idx === highlightedIndex}
                tabIndex={0}
                onMouseDown={() => onSelectSuggestion(s.name)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectSuggestion(s.name);
                    setShowSuggestions(false);
                    setHighlightedIndex(() => -1);
                    e.preventDefault();
                  }
                }}
              >
                <Search size={13} style={{ color: '#aaa', flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 500 }}>{s.name}</span>
                {s.sku && <span style={{ color: '#aaa', fontSize: 11 }}>{s.sku}</span>}
              </li>
            ))}
          </ul>
        )}
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
