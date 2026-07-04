import { useState, useCallback } from 'react';
import type { Category } from '../../../../types';
import { generateSlug } from '../../../../utils/productFormUtils';
import styles from '../AdminCategoryFormPage.module.css';

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

        // Auto-generar slug si está vacío o si el usuario aún no lo ha modificado
        if (!form.slug || !touched.slug) {
            const autoSlug = generateSlug(newName);
            setField('slug', autoSlug);
        }
    }, [form.slug, touched.slug, setField]);

    const handleBlur = useCallback((fieldName: string) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    }, []);

    return (
        <>
            {/* ── Información básica ── */}
            <fieldset className={styles.fieldset}>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="category-name">
                            Nombre *
                        </label>
                        <input
                            className={`${styles.input} ${touched.name && errors.name ? styles.inputError : ''
                                }`}
                            id="category-name"
                            value={form.name}
                            onChange={e => handleNameChange(e.target.value)}
                            onBlur={() => handleBlur('name')}
                            required
                            placeholder='Escriba una categoria'
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
                            className={`${styles.input} ${touched.slug && errors.slug ? styles.inputError : ''
                                }`}
                            id="category-slug"
                            value={form.slug}
                            onChange={e => {
                                setField('slug', e.target.value);
                                setTouched(prev => ({ ...prev, slug: true }));
                            }}
                            onBlur={() => handleBlur('slug')}
                            placeholder="Se genera automáticamente a partir del nombre"
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
                        <select
                            className={styles.select}
                            id="category-parent"
                            value={form.parentId || ''}
                            onChange={e => setField('parentId', e.target.value || null)}
                        >
                            <option value="">Sin categoría padre</option>
                            {parentCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className={styles.field}>
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={form.isVisible}
                            onChange={e => setField('isVisible', e.target.checked)}
                        />
                        <span className={styles.checkboxLabel}>Visible en el catálogo</span>
                    </label>
                </div>
            </fieldset>
        </>
    );
}
