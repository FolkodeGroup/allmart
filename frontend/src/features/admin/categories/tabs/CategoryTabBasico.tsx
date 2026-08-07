import { useState, useCallback, useMemo } from 'react';
import type { Category } from '../../../../types';
import { generateSlug } from '../../../../utils/productFormUtils';
import styles from '../AdminCategoryFormPage.module.css';
import { Dropdown } from '../../../../components/ui/Dropdown/Dropdown';

export interface CategoryTabBasicoProps {
    form: Omit<Category, 'id'>;
    errors?: Record<string, string>;
    setField: <K extends keyof Omit<Category, 'id'>>(
        key: K,
        value: Omit<Category, 'id'>[K]
    ) => void;
    parentCategories?: Category[];
}

export function CategoryTabBasico({
    form,
    errors = {},
    setField,
    parentCategories = [],
}: CategoryTabBasicoProps) {
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleNameChange = useCallback((newName: string) => {
        setField('name', newName);

        // Auto-generar slug si está vacío o si el usuario aún no lo ha modificado manualmente
        if (!form.slug || !touched.slug) {
            const autoSlug = generateSlug(newName);
            setField('slug', autoSlug);
        }
    }, [form.slug, touched.slug, setField]);

    const handleBlur = useCallback((fieldName: string) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    }, []);

    // Formateo de las opciones de categorías padre disponibles para el Dropdown
    const parentOptions = useMemo(() => {
        return [
            { value: '', label: '-- Sin categoría padre (Principal) --' },
            ...parentCategories.map(cat => ({
                value: cat.id,
                label: cat.parentId ? `  └─ ${cat.name}` : cat.name
            }))
        ];
    }, [parentCategories]);

    return (
        <fieldset className={styles.fieldset}>
            <style>{`
                .categoryBasicoInput {
                    min-height: 44px !important;
                    font-size: 16px !important;
                    box-sizing: border-box !important;
                }
                .categoryCheckboxRow {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-height: 48px;
                    cursor: pointer;
                    user-select: none;
                }
                .categoryCheckboxInput {
                    width: 22px;
                    height: 22px;
                    accent-color: var(--color-primary, #769282);
                    cursor: pointer;
                }
            `}</style>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-name">
                        Nombre *
                    </label>
                    <input
                        className={`${styles.input} categoryBasicoInput ${
                            touched.name && errors.name ? styles.inputError : ''
                        }`}
                        id="category-name"
                        value={form.name}
                        onChange={e => handleNameChange(e.target.value)}
                        onBlur={() => handleBlur('name')}
                        required
                        placeholder="Nombre de la categoría..."
                    />
                    {touched.name && errors.name && (
                        <span className={styles.errorText}>{errors.name}</span>
                    )}
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-slug">
                        Slug (URL amigable)
                    </label>
                    <input
                        className={`${styles.input} categoryBasicoInput ${
                            touched.slug && errors.slug ? styles.inputError : ''
                        }`}
                        id="category-slug"
                        value={form.slug}
                        onChange={e => {
                            setField('slug', e.target.value);
                            setTouched(prev => ({ ...prev, slug: true }));
                        }}
                        onBlur={() => handleBlur('slug')}
                        placeholder="Se genera automáticamente"
                    />
                    {touched.slug && errors.slug && (
                        <span className={styles.errorText}>{errors.slug}</span>
                    )}
                </div>
            </div>

            {parentCategories && parentCategories.length > 0 && (
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-parent">
                        Categoría padre (opcional)
                    </label>
                    <Dropdown
                        id="category-parent"
                        options={parentOptions}
                        value={form.parentId || ''}
                        onChange={val => setField('parentId', val || null)}
                        placeholder="-- Sin categoría padre (Principal) --"
                    />
                </div>
            )}

            <div className={styles.field}>
                <label className="categoryCheckboxRow" htmlFor="category-visibility-check">
                    <input
                        id="category-visibility-check"
                        type="checkbox"
                        className="categoryCheckboxInput"
                        checked={form.isVisible}
                        onChange={e => setField('isVisible', e.target.checked)}
                    />
                    <span className={styles.checkboxLabel}>Visible en el catálogo público</span>
                </label>
            </div>
        </fieldset>
    );
}