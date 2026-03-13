import React from 'react';
import styles from '../../features/admin/products/AdminProducts.module.css';

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
  total,
}) => (
  <nav className={styles.filters} style={{ position: 'relative', backgroundColor: "white", padding: "1rem", borderRadius: "16px", borderColor: "var(--color-border)", borderWidth: "1px", borderStyle: "solid"  }} aria-label="Filtros de productos">
    <label htmlFor="search-products" className="sr-only">Buscar productos</label>
    <input
      ref={inputRef}
      id="search-products"
      className={styles.searchInput}
      type="search"
      placeholder="Buscar por nombre o SKU..."
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
    {/* Sugerencias de autocompletado */}
    {showSuggestions && suggestions.length > 0 && (
      <ul
        id="suggestions-list"
        className={styles.suggestionsList}
        style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10 }}
        role="listbox"
        aria-label="Sugerencias de productos"
      >
        {suggestions.map((s, idx) => (
          <li
            key={s.id}
            id={`suggestion-${idx}`}
            className={styles.suggestionItem + (idx === highlightedIndex ? ' ' + styles.suggestionActive : '')}
            style={{ cursor: 'pointer', background: idx === highlightedIndex ? 'var(--color-bg-secondary)' : undefined }}
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
            <span style={{ fontWeight: 500 }}>{s.name}</span>
            {s.sku && <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>SKU: {s.sku}</span>}
          </li>
        ))}
      </ul>
    )}
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
    <span className={styles.count} aria-live="polite">{total} productos</span>
  </nav>
);
