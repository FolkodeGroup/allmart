// components/ui/StatusChipSelect/StatusChipSelect.tsx
import styles from '../AdminOrders.module.css';

interface StatusOption {
    value: string;
    label: string;
}

interface StatusChipSelectProps {
    options: StatusOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    label?: string;
    chipClassName?: string;
    chipCloseClassName?: string;
    selectClassName?: string;
    labelClassName?: string;
}

export function StatusChipSelect({
    options,
    selected,
    onChange,
    placeholder = 'Seleccionar...',
    label,
    chipClassName,
    chipCloseClassName,
    selectClassName,
    labelClassName,
}: StatusChipSelectProps) {
    const handleAdd = (value: string) => {
        if (!selected.includes(value)) {
            onChange([...selected, value]);
        }
    };

    const handleRemove = (value: string) => {
        onChange(selected.filter(s => s !== value));
    };

    return (
        <>
            {label && (
                <label className={labelClassName}>
                    {label}
                </label>
            )}
            <select
                value=""
                onChange={e => { if (e.target.value) handleAdd(e.target.value); }}
                className={selectClassName}
            >
                <option value="">{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div className={styles.chipsContainer}>
                {selected.map(s => {
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