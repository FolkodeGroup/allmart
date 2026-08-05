import { memo } from 'react';
import type { TabSEOPublicacionProps } from '../components/types';
import styles from './TabSeoPublicacion.module.css';

export const TabSEOPublicacion = memo(function TabSEOPublicacion({
    form,
}: TabSEOPublicacionProps) {
    const siteDomain = 'www.allmartbazar.com.ar';
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const previewUrl = `https://${siteDomain} › producto › ${slug || 'nombre-producto'}`;
    const previewTitle = form.name ? `${form.name} | Allmart Bazar` : 'Nombre del Producto | Allmart Bazar';
    const previewDescription = form.shortDescription || form.description || 'Descripción del producto en Allmart Bazar. Encontrá la mejor calidad y precio para tu hogar.';

    const checks = [
        { label: 'Nombre del producto', ok: !!form.name && form.name.trim().length >= 3 },
        { label: 'SKU configurado', ok: !!form.sku && form.sku.trim().length > 0 },
        { label: 'Precio válido', ok: typeof form.price === 'number' && form.price > 0 },
        { label: 'Categoría asignada', ok: !!form.category?.id },
        { label: 'Descripción completa', ok: !!form.description && form.description.trim().length > 10 },
        { label: 'Descripción corta SEO', ok: !!form.shortDescription && form.shortDescription.trim().length >= 10 },
        { label: 'Etiquetas cargadas', ok: Array.isArray(form.tags) && form.tags.length > 0 },
        { label: 'Características clave', ok: Array.isArray(form.features) && form.features.length > 0 },
    ];

    const completedCount = checks.filter(c => c.ok).length;
    const healthPercentage = Math.round((completedCount / checks.length) * 100);

    return (
        <div className={styles.seoContainer}>
            {/* Vista Previa en Google */}
            <div className={styles.googlePreviewCard}>
                <div className={styles.googleHeader}>
                    <span className={styles.googleIcon}>🔍</span>
                    <span className={styles.googleTitle}>Vista previa en Google</span>
                </div>
                <div className={styles.googleSnippet}>
                    <span className={styles.snippetUrl}>{previewUrl}</span>
                    <h3 className={styles.snippetTitle}>{previewTitle}</h3>
                    <p className={styles.snippetDescription}>
                        {previewDescription.length > 160 ? `${previewDescription.slice(0, 157)}...` : previewDescription}
                    </p>
                </div>
            </div>

            {/* Salud del Producto */}
            <div className={styles.healthCard}>
                <div className={styles.healthHeader}>
                    <span className={styles.healthTitle}>Salud de la publicación</span>
                    <span className={`${styles.healthBadge} ${healthPercentage >= 80 ? styles.healthOk : healthPercentage >= 50 ? styles.healthWarn : styles.healthLow}`}>
                        {healthPercentage}% Completo
                    </span>
                </div>
                <div className={styles.healthBarTrack}>
                    <div
                        className={styles.healthBarFill}
                        style={{
                            width: `${healthPercentage}%`,
                            backgroundColor: healthPercentage >= 80 ? '#10b981' : healthPercentage >= 50 ? '#f59e0b' : '#ef4444'
                        }}
                    />
                </div>
                <ul className={styles.checkList}>
                    {checks.map(({ label, ok }) => (
                        <li key={label} className={styles.checkItem}>
                            <span className={ok ? styles.checkIconOk : styles.checkIconPending}>
                                {ok ? '✓' : '○'}
                            </span>
                            <span className={ok ? styles.checkTextOk : styles.checkTextPending}>{label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
});