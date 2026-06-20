// features/admin/banners/BannerFilterBuilder.tsx
import { useState, useEffect, useRef } from 'react';
import type { BannerFilterConfig, BannerTag, BannerDestinationType } from '../../../types/bannerFilter';
import { BANNER_TAGS } from '../../../types/bannerFilter';
import { bannerFilterToUrl } from '../../../utils/bannerFilterToUrl';
import type { Category } from '../../../types/index';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { fetchAdminProducts } from '../products/productsService';
import styles from './BannerFilterBuilder.module.css';

interface ProductOption {
    slug: string;
    name: string;
}

interface Props {
    value: BannerFilterConfig;
    onChange: (config: BannerFilterConfig) => void;
    categories: Category[];
}

export function BannerFilterBuilder({ value, onChange, categories }: Props) {
    const { token } = useAdminAuth();
    const previewUrl = bannerFilterToUrl(value);
    const destinationType = value.destinationType ?? 'category';

    // Autocomplete de productos
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<ProductOption[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!query.trim() || !token) {
            setSuggestions([]);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoadingSuggestions(true);
            try {
                const res = await fetchAdminProducts(token, { q: query, limit: 8 });
                setSuggestions(res.data.map(p => ({ slug: p.slug, name: p.name })));
            } catch {
                setSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        }, 300);
    }, [query, token]);

    function handleDestinationChange(type: BannerDestinationType) {
        // Limpiar el otro tipo al cambiar
        onChange({
            ...value,
            destinationType: type,
            categorySlug: type === 'category' ? value.categorySlug : undefined,
            productSlugs: type === 'products' ? value.productSlugs : undefined,
        });
    }

    function handleCategoryChange(slug: string) {
        onChange({ ...value, categorySlug: slug || undefined });
    }

    function handleAddProduct(product: ProductOption) {
        const current = value.productSlugs ?? [];
        if (current.includes(product.slug)) return;
        onChange({ ...value, productSlugs: [...current, product.slug] });
        setQuery('');
        setSuggestions([]);
    }

    function handleRemoveProduct(slug: string) {
        onChange({
            ...value,
            productSlugs: (value.productSlugs ?? []).filter(s => s !== slug),
        });
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

            {/* ── Selector de tipo de destino ─────────────────────────── */}
            <div className={styles.field}>
                <p className={styles.label}>Tipo de destino</p>
                <div className={styles.typeToggle}>
                    <button
                        type="button"
                        className={`${styles.typeBtn} ${destinationType === 'category' ? styles.typeBtnActive : ''}`}
                        onClick={() => handleDestinationChange('category')}
                    >
                        Categoría
                    </button>
                    <button
                        type="button"
                        className={`${styles.typeBtn} ${destinationType === 'products' ? styles.typeBtnActive : ''}`}
                        onClick={() => handleDestinationChange('products')}
                    >
                        Productos específicos
                    </button>
                </div>
            </div>

            {/* ── Categoría ───────────────────────────────────────────── */}
            {destinationType === 'category' && (
                <div className={styles.field}>
                    <label htmlFor="banner-filter-category" className={styles.label}>Categoría</label>
                    <select
                        id="banner-filter-category"
                        value={value.categorySlug ?? ''}
                        onChange={e => handleCategoryChange(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">— Todas las categorías —</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* ── Productos específicos ────────────────────────────────── */}
            {destinationType === 'products' && (
                <div className={styles.field}>
                    <label htmlFor="banner-product-search" className={styles.label}>
                        Buscar productos
                    </label>

                    {/* Chips de productos seleccionados */}
                    {(value.productSlugs ?? []).length > 0 && (
                        <div className={styles.chipList}>
                            {(value.productSlugs ?? []).map(slug => (
                                <span key={slug} className={styles.chip}>
                                    {slug}
                                    <button
                                        type="button"
                                        className={styles.chipRemove}
                                        onClick={() => handleRemoveProduct(slug)}
                                        aria-label={`Quitar ${slug}`}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Input de búsqueda */}
                    <div className={styles.autocompleteWrapper}>
                        <input
                            id="banner-product-search"
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Escribí el nombre del producto..."
                            className={styles.select}
                            autoComplete="off"
                        />
                        {(suggestions.length > 0 || loadingSuggestions) && (
                            <ul className={styles.suggestionList}>
                                {loadingSuggestions && (
                                    <li className={styles.suggestionItem}>Buscando...</li>
                                )}
                                {suggestions.map(p => (
                                    <li key={p.slug}>
                                        <button
                                            type="button"
                                            className={styles.suggestionItem}
                                            onClick={() => handleAddProduct(p)}
                                        >
                                            {p.name}
                                            <span className={styles.suggestionSlug}>{p.slug}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tags ────────────────────────────────────────────────── */}
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

            {/* ── Preview URL ──────────────────────────────────────────── */}
            <div className={styles.preview}>
                <span className={styles.previewLabel}>URL generada:</span>
                <code className={styles.previewUrl}>{previewUrl}</code>
            </div>
        </div>
    );
}