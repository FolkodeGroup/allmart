import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, X, Search, Check } from 'lucide-react';
import styles from './Dropdown.module.css';
import { createPortal } from 'react-dom';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  id?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function useIsMobile(breakpoint = 767) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

export function Dropdown({
  id,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  disabled = false,
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement | HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const isMobile = useIsMobile();
  const selectedOption = options.find((opt) => opt.value === value);

  // Filtrado de opciones para la búsqueda en móvil
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  // Resetear búsqueda al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const updateMenuPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const GAP = 6;
    const MARGIN = 8;
    const PREFERRED_MAX_HEIGHT = 260;

    const spaceBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
    const spaceAbove = rect.top - GAP - MARGIN;

    const openUpwards = spaceBelow < PREFERRED_MAX_HEIGHT && spaceAbove > spaceBelow;

    if (openUpwards) {
      setMenuPos({
        bottom: window.innerHeight - rect.top + GAP,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(PREFERRED_MAX_HEIGHT, spaceAbove),
      });
    } else {
      setMenuPos({
        top: rect.bottom + GAP,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(PREFERRED_MAX_HEIGHT, spaceBelow),
      });
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isMobile) return;
    updateMenuPosition();
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isOpen, isMobile, updateMenuPosition]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((prev) => {
        if (!prev && !isMobile) updateMenuPosition();
        return !prev;
      });
      setFocusedIndex(-1);
    }
  };

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      containerRef.current?.querySelector('button')?.focus();
      return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex].value);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
    >
      <button
        id={id ? `${id}-trigger` : undefined}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? styles.label : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </button>

      {/* 🟢 MÓVIL (<768px): Bottom Sheet Modal Emergente vía Portal */}
      {isOpen && isMobile && createPortal(
        <div className={styles.mobileSheetOverlay}>
          <button
            type="button"
            className={styles.mobileSheetBackdrop}
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar opciones"
            tabIndex={-1}
          />
          <div
            ref={menuRef as React.RefObject<HTMLDivElement>}
            className={styles.mobileSheetContent}
            role="dialog"
            aria-modal="true"
            aria-label={placeholder || 'Seleccionar opción'}
          >
            <div className={styles.mobileSheetHandle} aria-hidden="true" />
            <div className={styles.mobileSheetHeader}>
              <span className={styles.mobileSheetTitle}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <button
                type="button"
                className={styles.mobileSheetCloseBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {options.length > 5 && (
              <div className={styles.mobileSheetSearchBox}>
                <Search size={16} className={styles.mobileSheetSearchIcon} />
                <input
                  type="search"
                  className={styles.mobileSheetSearchInput}
                  placeholder="Buscar opción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
            )}

            <ul className={styles.mobileSheetList} role="listbox">
              {filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    className={`${styles.mobileSheetOption} ${isSelected ? styles.mobileSheetOptionSelected : ''}`}
                    onClick={() => handleSelect(option.value)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect(option.value)}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={18} className={styles.mobileSheetCheck} />}
                  </li>
                );
              })}
              {filteredOptions.length === 0 && (
                <li className={styles.mobileSheetEmpty}>
                  No se encontraron resultados para "{searchQuery}".
                </li>
              )}
            </ul>
          </div>
        </div>,
        document.body
      )}

      {/* 💻 ESCRITORIO (>=768px): Popover flotante tradicional */}
      {isOpen && !isMobile && menuPos && createPortal(
        <ul
          ref={menuRef as React.RefObject<HTMLUListElement>}
          className={styles.menu}
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          style={{
            position: 'fixed',
            top: menuPos.top,
            bottom: menuPos.bottom,
            left: menuPos.left,
            width: menuPos.width,
            maxHeight: menuPos.maxHeight,
            zIndex: 100000,
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${isFocused ? styles.optionFocused : ''}`}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(option.value);
                  }
                }}
              >
                {option.label}
              </li>
            );
          })}
        </ul>,
        document.body
      )}

      <select
        id={id}
        value={value}
        onChange={(e) => handleSelect(e.target.value)}
        disabled={disabled}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          border: 0,
          pointerEvents: 'none',
        }}
        tabIndex={-1}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}