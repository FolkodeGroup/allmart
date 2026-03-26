import { useState, useRef, useEffect, useMemo } from 'react';
import type { Category } from '../../types';
import styles from './CategorySearchInput.module.css';

interface CategorySearchInputProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (category: Category) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CategorySearchInput({
  categories,
  value,
  onChange,
  onSelectSuggestion,
  placeholder = 'Buscar por nombre o slug...',
  disabled = false,
}: CategorySearchInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrado en memoria (case-insensitive, includes en name o slug)
  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const v = value.trim().toLowerCase();
    return categories.filter(
      c => c.name.toLowerCase().includes(v) || c.slug.toLowerCase().includes(v)
    ).slice(0, 8); // máximo 8 sugerencias
  }, [categories, value]);

  // Cierra sugerencias al perder foco
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!inputRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showSuggestions]);

  return (
    <div className={styles.wrapper}>
      <label htmlFor="category-search-input" style={{ display: 'none' }}>Buscar categoría</label>
      <input
        id="category-search-input"
        ref={inputRef}
        className={styles.input}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        disabled={disabled}
        aria-autocomplete="list"
        aria-controls="category-search-suggestions"
        aria-label="Buscar categoría"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map(cat => (
            <li
              key={cat.id}
              className={styles.suggestion}
              role="option"
              aria-selected={false}
              tabIndex={0}
              onMouseDown={e => {
                e.preventDefault();
                onChange(cat.name);
                setShowSuggestions(false);
                onSelectSuggestion?.(cat);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(cat.name);
                  setShowSuggestions(false);
                  onSelectSuggestion?.(cat);
                }
              }}
            >
              <span className={styles.suggestionName}>{cat.name}</span>
              <span className={styles.suggestionSlug}>{cat.slug}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
