// features/admin/banners/BannerFilterBuilder.tsx
import type { BannerFilterConfig, BannerTag } from '../../../types/bannerFilter';
import { BANNER_TAGS } from '../../../types/bannerFilter';
import { bannerFilterToUrl } from '../../../utils/bannerFilterToUrl';
import type { Category } from '../../../types/index';
import styles from './BannerFilterBuilder.module.css';

interface Props {
    value: BannerFilterConfig;
    onChange: (config: BannerFilterConfig) => void;
    categories: Category[];
}

export function BannerFilterBuilder({ value, onChange, categories }: Props) {
    const previewUrl = bannerFilterToUrl(value);

    function handleCategoryChange(slug: string) {
        onChange({ ...value, categorySlug: slug || undefined });
    }

    function handleTagToggle(tag: BannerTag) {
        const current = value.tags ?? [];
        const next = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];
        onChange({ ...value, tags: next.length ? next : undefined });
    }

    return (
        <div className={styles.wrapper}>
            <p className={styles.hint}>
                Seleccioná a dónde lleva este banner. Los filtros se combinan entre sí.
            </p>

            {/* Categoría */}
            <div className={styles.field}>
                <label htmlFor='banner-filter-category' className={styles.label}>Categoría</label>
                <select
                    value={value.categorySlug ?? ''}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className={styles.select}
                >
                    <option value="">— Todas las categorías —</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.slug}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tags */}
            <div className={styles.field}>
                <p id="tags-label" className={styles.label}>Etiquetas</p>
                <div className={styles.tagGrid} role="group" aria-labelledby="tags-label">
                    {BANNER_TAGS.map(({ value: tag, label }) => {
                        const active = (value.tags ?? []).includes(tag);
                        return (
                            <button
                                key={tag}
                                type="button"
                                className={`${styles.tagBtn} ${active ? styles.tagBtnActive : ''}`}
                                onClick={() => handleTagToggle(tag)}
                                aria-pressed={active}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Preview URL — feedback inmediato */}
            <div className={styles.preview}>
                <span className={styles.previewLabel}>URL generada:</span>
                <code className={styles.previewUrl}>{previewUrl}</code>
            </div>
        </div>
    );
}