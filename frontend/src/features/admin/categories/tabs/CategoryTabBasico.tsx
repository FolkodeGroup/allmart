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
    hasChildren?: boolean;
}

export function CategoryTabBasico({
    form,
    errors = {},
    setField,
    parentCategories = [],
    hasChildren = false,
}: CategoryTabBasicoProps) {
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleNameChange = useCallback((newName: string) => {
        setField('name', newName);

        if (!form.slug || !touched.slug) {
            const autoSlug = generateSlug(newName);
            setField('slug', autoSlug);
        }
    }, [form.slug, touched.slug, setField]);

    const handleBlur = useCallback((fieldName: string) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    }, []);

    // 🛡️ REGLA ARQUITECTÓNICA: Solo categorías raíz pueden ser seleccionadas como padre
    const parentOptions = useMemo(() => {
        const rootOnly = parentCategories.filter(cat => !cat.parentId);
        return [
            { value: '', label: '-- Sin categoría padre (Categoría Principal) --' },
            ...rootOnly.map(cat => ({
                value: cat.id,
                label: cat.name,
            }))
        ];
    }, [parentCategories]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="category-name">
                        Nombre *
                    </label>
                    <input
                        className={`${styles.input} ${
                            touched.name && errors.name ? styles.inputError : ''
                        }`}
                        id="category-name"
                        value={form.name}
                        onChange={e => handleNameChange(e.target.value)}
                        onBlur={() => handleBlur('name')}
                        required
                        placeholder="Ej: Cocina, Bazar, Hogar..."
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
                        className={`${styles.input} ${
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

            <div className={styles.field}>
                <label className={styles.label} htmlFor="category-parent">
                    Categoría Padre (Jerarquía Máxima: 2 Niveles)
                </label>
                <Dropdown
                    id="category-parent"
                    options={parentOptions}
                    value={form.parentId || ''}
                    onChange={val => setField('parentId', val || null)}
                    placeholder="-- Sin categoría padre (Categoría Principal) --"
                    disabled={hasChildren}
                />
                {hasChildren && (
                    <span className={styles.fieldHint} style={{ color: 'var(--color-accent, #DDB08C)', marginTop: '4px', display: 'block' }}>
                        ℹ️ Esta categoría ya cuenta con subcategorías hijas asociadas y no puede anidarse dentro de otra.
                    </span>
                )}
            </div>

            <div className={styles.field}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', minHeight: '44px' }} htmlFor="category-visibility-check">
                    <input
                        id="category-visibility-check"
                        type="checkbox"
                        style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary, #769282)', cursor: 'pointer' }}
                        checked={form.isVisible}
                        onChange={e => setField('isVisible', e.target.checked)}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary, #ffffff)' }}>
                        Visible en el catálogo público
                    </span>
                </label>
            </div>
        </div>
    );
}