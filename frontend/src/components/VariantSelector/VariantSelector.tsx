import React from 'react';
import styles from './VariantSelector.module.css';

interface VariantGroup {
    id: string;
    name: string;
    values: string[];
}

type Props = {
    group: VariantGroup;
    selected?: string;
    onSelect: (value: string) => void;
    isValueDisabled?: (value: string) => boolean;
};

function looksLikeColor(value: string): boolean {
    if (!value) return false;
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) || /^rgba?\(/i.test(value) || /^[a-z]+$/i.test(value.trim());
}

export const VariantSelector: React.FC<Props> = ({ group, selected, onSelect, isValueDisabled }) => {
    const isColorGroup = group.name.toLowerCase().includes('color') || group.values.every(v => looksLikeColor(String(v)));

    return (
        <div className={styles.wrapper} role="group" aria-label={group.name}>
            <div className={styles.label}>
                {group.name}
                {selected && <span className={styles.selectedValue}>: {selected}</span>}
            </div>
            <div className={styles.options}>
                {group.values.map((val) => {
                    const value = String(val);
                    const disabled = isValueDisabled?.(value) ?? false;
                    const commonProps = {
                        type: 'button' as const,
                        disabled,
                        'aria-pressed': selected === value,
                        'aria-disabled': disabled,
                        onClick: () => !disabled && onSelect(value),
                        title: disabled ? `${value} (no disponible con esta combinación)` : value,
                    };

                    if (isColorGroup) {
                        return (
                            <button
                                key={value}
                                {...commonProps}
                                className={`${styles.colorCircle} ${selected === value ? styles.selected : ''} ${disabled ? styles.unavailable : ''}`}
                                style={{ background: value }}
                            >
                                <span className={styles.srOnly}>{value}</span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={value}
                            {...commonProps}
                            className={`${styles.optionBox} ${selected === value ? styles.selectedBox : ''} ${disabled ? styles.unavailable : ''}`}
                        >
                            {value}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default VariantSelector;