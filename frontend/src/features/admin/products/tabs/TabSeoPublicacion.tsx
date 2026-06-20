import { memo } from 'react';
import type { TabSEOPublicacionProps } from '../components/types';
import styles from '../AdminProductFormPage.module.css';

export const TabSEOPublicacion = memo(function TabSEOPublicacion({
    form,
    fieldErrors: _fieldErrors,
    setField,
}: TabSEOPublicacionProps) {
    const slugPreview =
        form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const nameLen = form.name.length;
    const descLen = form.shortDescription?.length ?? 0;

    return (
        <>
            <fieldset className={styles.fieldset}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-slug">
                        <i className="bi bi-link-45deg" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i>
                        Slug (URL amigable)
                    </label>
                    <input
                        className={styles.input}
                        id="product-slug"
                        value={form.slug}
                        onChange={e => setField('slug', e.target.value)}
                        placeholder="se-genera-automaticamente"
                    />
                    <span className={styles.fieldHint}>
                        Vista previa: <strong>/{slugPreview || '...'}</strong>
                    </span>
                </div>

                <div className={styles.field}>
                    <p className={styles.label}>
                        <i className="bi bi-chat-left-text" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i>
                        Nombre del producto
                    </p>
                    <p className={styles.fieldHint}>
                        {nameLen} caracteres{' '}
                        <span style={{ color: nameLen >= 30 && nameLen <= 60 ? '#059669' : '#d97706' }}>
                            (recomendado: 30–60)
                        </span>
                    </p>
                </div>

                <div className={styles.field}>
                    <p className={styles.label}>
                        <i className="bi bi-card-text" style={{ color: 'var(--color-primary)', marginRight: '6px' }}></i>
                        Descripción corta (meta description)
                    </p>
                    <p className={styles.fieldHint}>
                        {descLen} caracteres{' '}
                        <span style={{ color: descLen >= 120 && descLen <= 160 ? '#059669' : '#d97706' }}>
                            (recomendado: 120–160)
                        </span>
                    </p>
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend} style={{ color: 'var(--color-text-primary)' }}>
                    Checklist de SEO y publicación
                </legend>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '8px',
                    }}
                >
                    {[
                        { label: 'Nombre', ok: !!form.name, icon: 'bi-fonts' },
                        { label: 'Descripción completa', ok: !!form.description, icon: 'bi-justify-left' },
                        { label: 'Descripción corta', ok: !!form.shortDescription, icon: 'bi-card-text' },
                        { label: 'Categoría', ok: !!form.category?.id, icon: 'bi-tag' },
                        { label: 'Precio', ok: form.price > 0, icon: 'bi-currency-dollar' },
                        { label: 'SKU', ok: !!form.sku, icon: 'bi-hash' },
                        { label: 'Etiquetas', ok: form.tags.length > 0, icon: 'bi-tags' },
                        { label: 'Características', ok: (form.features ?? []).length > 0, icon: 'bi-list-check' },
                    ].map(({ label, ok, icon }) => (
                        <div
                            key={label}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: ok ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                border: `1px solid ${ok ? '#bbf7d0' : '#fde68a'}`,
                                fontSize: '0.82rem',
                            }}
                        >
                            <span style={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className={`bi ${icon}`} style={{ color: ok ? 'var(--color-primary)' : 'var(--color-accent-dark)' }}></i>
                                {label}
                            </span>
                            <i 
                                className={ok ? "bi bi-check-circle-fill" : "bi bi-exclamation-triangle-fill"} 
                                style={{ color: ok ? '#059669' : '#d97706' }}
                            ></i>
                        </div>
                    ))}
                </div>
            </fieldset>
        </>
    );
});