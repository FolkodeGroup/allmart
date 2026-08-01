import React, { memo, useMemo } from 'react';
import type { TabFormState, SetField } from '../components/types';
import type { Category } from '../../../../types';
import styles from '../AdminProductFormPage.module.css';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

interface TabCategoriasProps extends TabFormState {
    setField: SetField;
    categories: Category[];
    additionalCategoryIds: string[];
    onPrimaryCategoryChange: (value: string) => void;
    onAdditionalCategoriesChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    getCategoryLabel: (category: { id: string; name: string; parentId?: string | null }) => string;
}

export const TabCategorias = memo(function TabCategorias({
    form,
    fieldErrors,
    categories,
    additionalCategoryIds,
    onPrimaryCategoryChange,
    onAdditionalCategoriesChange,
    getCategoryLabel,
}: TabCategoriasProps) {

    const categoryOptions = useMemo(() => {
        return categories.map(c => ({
            value: c.id,
            label: getCategoryLabel(c)
        }));
    }, [categories, getCategoryLabel]);

    const availableAdditionalCategories = useMemo(() => {
        return categories.filter(c => c.id !== form.category.id);
    }, [categories, form.category.id]);

    const handleCheckboxToggle = (categoryId: string, checked: boolean) => {
        const next = checked
            ? [...additionalCategoryIds, categoryId]
            : additionalCategoryIds.filter(id => id !== categoryId);

        onAdditionalCategoriesChange({
            target: {
                selectedOptions: next.map(id => ({ value: id }))
            }
        } as unknown as React.ChangeEvent<HTMLSelectElement>);
    };

    return (
        <fieldset className={styles.fieldset}>
            <div className={styles.field}>
                <label className={styles.label} htmlFor="product-category">
                    Categoría Principal *
                </label>
                <Dropdown
                    id="product-category"
                    options={categoryOptions}
                    value={form.category.id}
                    onChange={onPrimaryCategoryChange}
                    placeholder="Seleccioná una categoría..."
                    className={fieldErrors.category ? styles.inputError : ''}
                />
                {fieldErrors.category && (
                    <span className={styles.errorText}>{fieldErrors.category}</span>
                )}
            </div>

            <div className={styles.field}>
                <label className={styles.label} htmlFor="product-categories">
                    Categorías adicionales
                </label>

                {/* Listado táctil de Checkboxes para móvil */}
                <div className="additionalCategoriesMobileList">
                    <style>{`
                        .additionalCategoriesMobileList {
                            display: flex;
                            flex-direction: column;
                            gap: 8px;
                            max-height: 220px;
                            overflow-y: auto;
                            padding: 8px;
                            background: var(--color-bg-secondary, #28353d);
                            border: 1px solid var(--color-border, #e5e2dd);
                            border-radius: 8px;
                        }
                        .additionalCategoryCheckRow {
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            padding: 6px 8px;
                            border-radius: 6px;
                            cursor: pointer;
                            min-height: 44px;
                            user-select: none;
                        }
                        .additionalCategoryCheckRow:hover {
                            background: rgba(255, 255, 255, 0.05);
                        }
                    `}</style>
                    {availableAdditionalCategories.length === 0 ? (
                        <span className={styles.fieldHint}>No hay más categorías disponibles.</span>
                    ) : (
                        availableAdditionalCategories.map(c => {
                            const isChecked = additionalCategoryIds.includes(c.id);
                            return (
                                <label key={c.id} className="additionalCategoryCheckRow">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={e => handleCheckboxToggle(c.id, e.target.checked)}
                                        style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                                    />
                                    <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                                        {getCategoryLabel(c)}
                                    </span>
                                </label>
                            );
                        })
                    )}
                </div>
            </div>
        </fieldset>
    );
});