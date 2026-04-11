// ─────────────────────────────────────────────────────────────────────────────
// StatusChipSelect.tsx
// Select + chips para selección múltiple de estados.
// Usado en <OrdersFiltersBar> para filtrar pedidos por uno o varios estados.
// ─────────────────────────────────────────────────────────────────────────────
import styles from '../AdminOrders.module.css';

/** Par valor / etiqueta para cada opción del select. */
interface StatusOption {
    value: string;
    label: string;
}

/**
 * Props de StatusChipSelect.
 *
 * @example
 * <StatusChipSelect
 *   options={[{ value: 'pendiente', label: 'Pendiente' }]}
 *   selected={['pendiente']}
 *   onChange={statuses => setFilters({ ...filters, statuses })}
 *   placeholder="Todos los estados"
 *   label="Estado"
 * />
 */

interface StatusChipSelectProps {
    options: StatusOption[];          // lista completa de opciones disponibles
    selected: string[];               // valores actualmente seleccionados
    onChange: (selected: string[]) => void; // callback con el nuevo array tras agregar/quitar
    placeholder?: string;             // texto del option vacío del select
    label?: string;                   // label visible encima del select
    chipClassName?: string;           // clase extra para cada chip (no usada internamente, por si el padre quiere override)
    chipCloseClassName?: string;      // clase para el botón ✕ de cada chip
    selectClassName?: string;         // clase extra para el <select> (no usada internamente)
    labelClassName?: string;          // clase para el <label>
}


/**
 * StatusChipSelect — selector múltiple con chips visuales.
 *
 * Flujo de uso:
 *  1. El usuario elige un estado en el <select> → se agrega a `selected` vía handleAdd.
 *  2. Cada estado seleccionado se muestra como un chip debajo del select.
 *  3. Al presionar ✕ en un chip → se quita de `selected` vía handleRemove.
 *
 * El select siempre muestra todas las opciones disponibles (incluyendo las ya
 * seleccionadas), pero handleAdd previene duplicados silenciosamente.
 */

export function StatusChipSelect({
    options,
    selected,
    onChange,
    placeholder = 'Seleccionar...',
    label,
    chipCloseClassName,
    labelClassName,
}: StatusChipSelectProps) {

    /**
     * Agrega un valor a la selección.
     * El guard `!selected.includes(value)` evita duplicados sin lanzar error.
     */
    const handleAdd = (value: string) => {
        if (!selected.includes(value)) {
            onChange([...selected, value]);
        }
    };

    /** Quita un valor de la selección por filtro. */
    const handleRemove = (value: string) => {
        onChange(selected.filter(s => s !== value));
    };

    return (
        <>
            {/* ── Select para agregar estados ── */}
            <div className={styles.filterSelectWrap}>
                {label && (
                    <label className={labelClassName}>
                        {label}
                    </label>
                )}
                {/*
                  El select siempre vuelve al placeholder tras la selección porque
                  `value` está fijado en `selected[0] || ''`. Esto es intencional:
                  el select actúa como disparador, no como indicador del estado actual.
                */}
                <select
                    className={styles.filterSelect}
                    value={selected[0] || ''}
                    onChange={e => { if (e.target.value) handleAdd(e.target.value); }}
                    aria-label="Filtrar por estado"
                >
                    <option value="">{placeholder}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* ── Chips de estados seleccionados ── */}
            <div className={styles.chipsContainer}>
                {selected.map(s => {
                    // Busca la etiqueta legible; cae al valor crudo si no la encuentra
                    const label = options.find(o => o.value === s)?.label || s;
                    return (
                        <span key={s} className={styles.chip}>
                            {label}
                            <button
                                type="button"
                                className={chipCloseClassName}
                                onClick={() => handleRemove(s)}
                            >
                                ✕
                            </button>
                        </span>
                    );
                })}
            </div>
        </>
    );
}