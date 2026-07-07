import { memo, useMemo } from 'react';
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
    
    // ── Mapeo de categorías para el componente Dropdown Customizado ──
    const categoryOptions = useMemo(() => {
        return categories.map(c => ({
            value: c.id,
            label: getCategoryLabel(c)
        }));
    }, [categories, getCategoryLabel]);

    return (
        <fieldset className={styles.fieldset}>
            <div className={styles.field}>
                <label className={styles.label} htmlFor="product-category">
                    Categoría Principal *
                </label>
                {/* 🟢 Reemplazo por el componente Dropdown unificado con control total de UI/Hover */}
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
                <select
                    className={styles.input}
                    id="product-categories"
                    multiple
                    size={Math.min(Math.max(categories.length - 1, 3), 6)}
                    value={additionalCategoryIds}
                    onChange={onAdditionalCategoriesChange}
                    disabled={categories.length === 0}
                    style={{ minHeight: '120px' }}
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