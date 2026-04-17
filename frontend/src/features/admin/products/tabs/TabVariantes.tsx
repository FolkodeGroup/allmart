// src/features/admin/products/components/tabs/TabVariantes.tsx
import { forwardRef, useImperativeHandle, useState } from 'react';
import type { TabVariantesProps } from '../components/types';

export type TabVariantesRef = {
    validate: () => Record<string, string>;
};
import styles from '../AdminProductFormPage.module.css';

export const TabVariantes = forwardRef<TabVariantesRef, TabVariantesProps>(function TabVariantes({
    form,
    newGroupName,
    setNewGroupName,
    newGroupValues,
    setNewGroupValues,
    onAddVariantGroup,
    onRemoveVariantGroup,
    onAddVariantValue,
    onRemoveVariantValue,
    errors = {},
}: TabVariantesProps, ref) {
    const [localErrors, setLocalErrors] = useState<Record<string, string>>(errors);

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            // Ejemplo: validar que haya al menos un grupo de variantes
            if (!form.variants || form.variants.length === 0) errs.variants = 'Agrega al menos un grupo de variantes';
            setLocalErrors(errs);
            return errs;
        }
    }), [form]);

    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Variantes</legend>
            <p className={styles.fieldHint}>
                Agrupá opciones como Color o Tamaño. Gestiona todas tus variantes desde la pestaña de
                Variantes en esta vista.
            </p>

            {/* Agregar nuevo grupo */}
            <div className={styles.tagRow}>
                <input
                    className={styles.input}
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddVariantGroup())}
                    placeholder="Nombre del grupo, ej: Color, Tamaño..."
                />
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={onAddVariantGroup}
                    aria-label="Agregar grupo de variantes"
                >
                    + Grupo
                </button>
            </div>
            {localErrors.variants && <span className={styles.errorText}>{localErrors.variants}</span>}

            {/* Grupos existentes */}
            {(form.variants ?? []).map(group => (
                <div key={group.id} className={styles.variantGroup}>
                    <div className={styles.variantGroupHeader}>
                        <span className={styles.variantGroupName}>{group.name}</span>
                        <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => onRemoveVariantGroup(group.id)}
                            aria-label={`Eliminar grupo ${group.name}`}
                        >
                            ✕
                        </button>
                    </div>

                    <div className={styles.tags}>
                        {group.values.map(val => (
                            <span key={val} className={styles.tag}>
                                {val}
                                <button
                                    type="button"
                                    className={styles.tagRemove}
                                    onClick={() => onRemoveVariantValue(group.id, val)}
                                    aria-label={`Eliminar variante ${val}`}
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                    </div>

                    <div className={styles.tagRow}>
                        <input
                            className={styles.input}
                            value={newGroupValues[group.id] ?? ''}
                            onChange={e =>
                                setNewGroupValues(prev => ({ ...prev, [group.id]: e.target.value }))
                            }
                            onKeyDown={e =>
                                e.key === 'Enter' && (e.preventDefault(), onAddVariantValue(group.id))
                            }
                            placeholder={`Agregar valor a ${group.name}...`}
                        />
                        <button
                            type="button"
                            className={styles.addBtn}
                            onClick={() => onAddVariantValue(group.id)}
                            aria-label={`Agregar valor a ${group.name}`}
                        >
                            ＋
                        </button>
                    </div>
                </div>
            ))}

            {(form.variants ?? []).length === 0 && (
                <p className={styles.fieldHint} style={{ marginTop: '8px', fontStyle: 'italic' }}>
                    Todavía no hay grupos de variantes. Creá uno arriba.
                </p>
            )}
        </fieldset>
    );
});