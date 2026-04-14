// src/features/admin/products/components/tabs/TabSEOPublicacion.tsx
import { memo } from 'react';
import type { TabSEOPublicacionProps } from '../components/types';
import styles from '../AdminProductForm.module.css';

export const TabSEOPublicacion = memo(function TabSEOPublicacion({
    form,
    // FIX: fieldErrors no se usa en este tab — se prefija con _ para silenciar el warning
    fieldErrors: _fieldErrors,
    setField,
}: TabSEOPublicacionProps) {
    const slugPreview =
        form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const nameLen = form.name.length;
    const descLen = form.shortDescription?.length ?? 0;

    return (
        <>
            {/* ── SEO básico ── */}
            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>SEO y URL</legend>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="product-slug">
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

                {/* FIX: los `<label>` sin control asociado deben ser `<p>` o `<span>` descriptivos */}
                <div className={styles.field}>
                    <p className={styles.label}>Nombre del producto</p>
                    <p className={styles.fieldHint}>
                        {nameLen} caracteres{' '}
                        <span style={{ color: nameLen >= 30 && nameLen <= 60 ? '#059669' : '#d97706' }}>
                            (recomendado: 30–60)
                        </span>
                    </p>
                </div>

                <div className={styles.field}>
                    <p className={styles.label}>Descripción corta (meta description)</p>
                    <p className={styles.fieldHint}>
                        {descLen} caracteres{' '}
                        <span style={{ color: descLen >= 120 && descLen <= 160 ? '#059669' : '#d97706' }}>
                            (recomendado: 120–160)
                        </span>
                    </p>
                </div>
            </fieldset>

            {/* ── Calidad de contenido ── */}
            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Calidad del contenido</legend>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '8px',
                    }}
                >
                    {[
                        { label: 'Nombre', ok: !!form.name },
                        { label: 'Descripción completa', ok: !!form.description },
                        { label: 'Descripción corta', ok: !!form.shortDescription },
                        { label: 'Categoría', ok: !!form.category?.id },
                        { label: 'Precio', ok: form.price > 0 },
                        { label: 'SKU', ok: !!form.sku },
                        { label: 'Etiquetas', ok: form.tags.length > 0 },
                        { label: 'Características', ok: (form.features ?? []).length > 0 },
                    ].map(({ label, ok }) => (
                        <div
                            key={label}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: ok ? '#f0fdf4' : '#fffbeb',
                                border: `1px solid ${ok ? '#bbf7d0' : '#fde68a'}`,
                                fontSize: '0.82rem',
                            }}
                        >
                            <span style={{ color: '#374151' }}>{label}</span>
                            <span style={{ fontWeight: 700, color: ok ? '#059669' : '#d97706' }}>
                                {ok ? '✓' : '⚠'}
                            </span>
                        </div>
                    ))}
                </div>
            </fieldset>
        </>
    );
});