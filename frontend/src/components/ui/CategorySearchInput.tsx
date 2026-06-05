import { useRef } from 'react';
import styles from './CategorySearchInput.module.css';
import { Search } from 'lucide-react';

interface CategorySearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CategorySearchInput({
  value,
  onChange,
  placeholder = 'Buscar por nombre o slug...',
  disabled = false,
}: CategorySearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.wrapper}>
      <Search size={16} className={styles.searchIcon} />
      <label htmlFor="category-search-input" style={{ display: 'none' }}>Buscar categoría</label>
      <input
        id="category-search-input"
        ref={inputRef}
        className={styles.searchInput}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Buscar categoría"
        autoComplete="off"
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
