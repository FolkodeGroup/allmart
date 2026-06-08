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
};

function looksLikeColor(value: string): boolean {
    if (!value) return false;
    // simple heuristics: hex (#fff, #ffffff) or rgb/rgba or common color names (letters only)
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) || /^rgba?\(/i.test(value) || /^[a-z]+$/i.test(value.trim());
}

export const VariantSelector: React.FC<Props> = ({ group, selected, onSelect }) => {
    const isColorGroup = group.name.toLowerCase().includes('color') || group.values.every(v => looksLikeColor(String(v)));

    return (
        <div className={styles.wrapper} role="group" aria-label={group.name}>
            <div className={styles.label}>{group.name}:</div>
            <div className={styles.options}>
                {group.values.map((val) => {
                    const value = String(val);
                    if (isColorGroup) {
                        return (
                            <button
                                key={value}
                                type="button"
                                className={`${styles.colorCircle} ${selected === value ? styles.selected : ''}`}
                                onClick={() => onSelect(value)}
                                aria-pressed={selected === value}
                                title={value}
                                style={{ background: value }}
                            >
                                <span className={styles.srOnly}>{value}</span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={value}
                            type="button"
                            className={`${styles.optionBox} ${selected === value ? styles.selectedBox : ''}`}
                            onClick={() => onSelect(value)}
                            aria-pressed={selected === value}
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
