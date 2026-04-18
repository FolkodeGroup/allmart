// src/features/admin/products/components/tabs/TabCategorias.tsx
import { memo } from 'react';
import type { TabFormState, SetField } from '../components/types';
// FIX: importar Category desde los tipos del dominio, no AdminCategory del contexto
// (AdminCategoriesContext no exporta `AdminCategory`)
import type { Category } from '../../../../types';
import styles from '../AdminProductFormPage.module.css';

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
    return (
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Categoría y etiquetas</legend>

            <div className={styles.field}>
                <label className={styles.label} htmlFor="product-category">Categoría *</label>
                <select
                    className={`${styles.input} ${fieldErrors.category ? styles.inputError : ''}`}
                    id="product-category"
                    value={form.category.id}
                    onChange={e => onPrimaryCategoryChange(e.target.value)}
                >
                    <option value="">Seleccioná una categoría...</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>
                            {getCategoryLabel(c)}
                        </option>
                    ))}
                </select>
                {fieldErrors.category && (
                    <span className={styles.errorText}>{fieldErrors.category}</span>
                )}
            </div>

            <div className={styles.field}>
                <label className={styles.label} htmlFor="product-categories">Categorías adicionales</label>
                <select
                    className={styles.input}
                    id="product-categories"
                    multiple
                    size={Math.min(Math.max(categories.length - 1, 3), 6)}
                    value={additionalCategoryIds}
                    onChange={onAdditionalCategoriesChange}
                    disabled={categories.length === 0}
                >
                    {categories
                        .filter(c => c.id !== form.category.id)
                        .map(c => (
                            <option key={c.id} value={c.id}>
                                {getCategoryLabel(c)}
                            </option>
                        ))}
                </select>
                <span className={styles.fieldHint}>Usá Ctrl/Cmd para seleccionar varias.</span>
            </div>
        </fieldset>
    );
});