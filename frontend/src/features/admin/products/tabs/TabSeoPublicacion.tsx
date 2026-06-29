import { memo } from 'react';
import type { TabSEOPublicacionProps } from '../components/types';
import styles from '../AdminProductFormPage.module.css';

export const TabSEOPublicacion = memo(function TabSEOPublicacion({
    form,
    fieldErrors: _fieldErrors,
}: TabSEOPublicacionProps) {

    return (
        <>
            <fieldset className={styles.fieldset}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '1rem',
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