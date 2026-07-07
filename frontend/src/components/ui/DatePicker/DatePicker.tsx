import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', disabled = false, id }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Establecer fecha de referencia para navegación (local)
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar navegación al cambiar la fecha externa
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, d));
    }
  }, [value]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generar matriz de días para el mes actual
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    const arr = [];
    // Espacios vacíos de días del mes anterior
    for (let i = 0; i < firstDayIndex; i++) {
      arr.push(null);
    }
    // Días del mes actual
    for (let day = 1; day <= totalDays; day++) {
      arr.push(day);
    }
    return arr;
  }, [year, month]);

  const handlePrevMonth = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleSelectDay = useCallback((day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const selectedDateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(selectedDateStr);
    setIsOpen(false);
  }, [year, month, onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  }, [onChange]);

  // Formatear visualmente en input (dd/mm/aaaa)
  const displayValue = useMemo(() => {
    if (!value) return '';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }, [value]);

  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return d === day && (m - 1) === month && y === year;
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.inputWrapper}>
        <CalendarIcon className={styles.inputIcon} size={16} />
        <input
          id={id}
          type="text"
          className={styles.input}
          value={displayValue}
          onClick={() => !disabled && setIsOpen(prev => !prev)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
        />
        {value && !disabled && (
          <button 
            type="button" 
            className={styles.clearButton} 
            onClick={handleClear}
            aria-label="Limpiar fecha"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div ref={popoverRef} className={styles.popover} role="dialog">
          <div className={styles.calendarHeader}>
            <button type="button" className={styles.navButton} onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className={styles.monthLabel}>
              {MONTHS[month]} {year}
            </span>
            <button type="button" className={styles.navButton} onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className={styles.weekdaysGrid}>
            {WEEKDAYS.map(w => (
              <span key={w} className={styles.weekday}>{w}</span>
            ))}
          </div>

          <div className={styles.daysGrid}>
            {daysInMonth.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className={`${styles.day} ${styles.dayEmpty}`} />;
              }

              const classes = [
                styles.day,
                isToday(day) ? styles.dayToday : '',
                isSelected(day) ? styles.daySelected : ''
              ].filter(Boolean).join(' ');

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  className={classes}
                  onClick={() => handleSelectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}