import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Dropdown.module.css';

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
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
      setFocusedIndex(-1);
    }
  };

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);
  }, [onChange]);

  // Soporte de navegación por teclado accesible (WAI-ARIA)
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

      {isOpen && (
        <ul 
          className={styles.menu} 
          role="listbox" 
          tabIndex={-1}
          onKeyDown={handleKeyDown}
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
                className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${
                  isFocused ? styles.optionFocused : ''
                }`}
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
        </ul>
      )}

      {/* Select de respaldo invisible para pruebas de Testing Library, autocompletado y soporte nativo de formularios */}
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