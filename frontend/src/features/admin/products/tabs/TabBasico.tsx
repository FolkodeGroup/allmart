// src/features/admin/products/components/tabs/TabBasico.tsx
import { forwardRef, useImperativeHandle, useState } from 'react';
import type { TabBasicoProps } from '../components/types';

export type TabBasicoRef = {
    validate: () => Record<string, string>;
};
import styles from '../AdminProductForm.module.css';

export const TabBasico = forwardRef<TabBasicoRef, TabBasicoProps>(function TabBasico({
    form,
    errors = {},
    setField,
    tagInput,
    setTagInput,
    featureInput,
    setFeatureInput,
    onAddTag,
    onRemoveTag,
    onAddFeature,
    onRemoveFeature,
}, ref) {
    const [localErrors, setLocalErrors] = useState<Record<string, string>>(errors);

    useImperativeHandle(ref, () => ({
        validate: () => {
            const errs: Record<string, string> = {};
            if (!form.name.trim()) errs.name = 'El nombre es obligatorio';
            // ...otras validaciones del tab...
            setLocalErrors(errs);
            return errs;
        }
    }), [form]);

    return (
        <>
            {/* ── Información básica ── */}
            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Información básica</legend>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="product-name">Nombre *</label>
                        <input
                            className={`${styles.input} ${localErrors.name ? styles.inputError : ''}`}
                            id="product-name"
                            value={form.name}
                            onChange={e => setField('name', e.target.value)}
                            required
                        />
                        {localErrors.name && <span className={styles.errorText}>{localErrors.name}</span>}
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="product-sku">SKU</label>
                        <input
                            className={styles.input}
                            id="product-sku"
                            value={form.sku}
                            onChange={e => setField('sku', e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-short-desc">Descripción corta</label>
                    <input
                        className={styles.input}
                        id="product-short-desc"
                        value={form.shortDescription}
                        onChange={e => setField('shortDescription', e.target.value)}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-desc">Descripción completa</label>
                    <textarea
                        className={styles.textarea}
                        id="product-desc"
                        rows={5}
                        value={form.description}
                        onChange={e => setField('description', e.target.value)}
                    />
                </div>
            </fieldset>

            {/* ── Etiquetas ── */}
            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Etiquetas</legend>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-tags">Agregar etiqueta</label>
                    <div className={styles.tagRow}>
                        <input
                            className={styles.input}
                            id="product-tags"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
                            placeholder="Ej: destacado, oferta, nuevo..."
                        />
                        <button type="button" className={styles.addBtn} onClick={onAddTag}>＋</button>
                    </div>
                    {form.tags.length > 0 && (
                        <div className={styles.tags}>
                            {form.tags.map(t => (
                                <span key={t} className={styles.tag}>
                                    {t}
                                    <button
                                        type="button"
                                        onClick={() => onRemoveTag(t)}
                                        className={styles.tagRemove}
                                        aria-label={`Eliminar etiqueta ${t}`}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </fieldset>

            {/* ── Características ── */}
            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Características</legend>
                <div className={styles.tagRow}>
                    <input
                        className={styles.input}
                        value={featureInput}
                        onChange={e => setFeatureInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddFeature())}
                        placeholder="Ej: Material: acero inoxidable"
                    />
                    <button
                        type="button"
                        className={styles.addBtn}
                        onClick={onAddFeature}
                        aria-label="Agregar característica"
                    >
                        ＋
                    </button>
                </div>
                {(form.features ?? []).length > 0 && (
                    <ul className={styles.featureList}>
                        {(form.features ?? []).map((f, i) => (
                            <li key={i} className={styles.featureItem}>
                                <span>{f}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveFeature(i)}
                                    className={styles.tagRemove}
                                    aria-label={`Eliminar característica ${f}`}
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </fieldset>
        </>
    );
});