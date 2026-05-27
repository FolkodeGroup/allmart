import React, { useState, useMemo, useRef } from 'react';
import { Search, PackageSearch } from 'lucide-react';
import type { SupplierProductItem } from './suppliersAdminService';
import { DEFAULT_IMAGE_PLACEHOLDER, normalizeImageUrl } from '../../../utils/imageUrl';
import styles from './SupplierProductListPanel.module.css';

interface SupplierProductListPanelProps {
    products: SupplierProductItem[];
    loading: boolean;
    selectedProductId?: string;
    onSelectProduct: (id: string) => void;
}

export function SupplierProductListPanel({
    products,
    loading,
    selectedProductId,
    onSelectProduct,
}: SupplierProductListPanelProps) {
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const currencyFormatter = useMemo(
        () => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }),
        []
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return products;
        const q = search.trim().toLowerCase();
        return products.filter(
            p =>
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.category?.name ?? '').toLowerCase().includes(q)
        );
    }, [products, search]);

    return (
        <aside className={styles.panel}>
            <div className={styles.searchWrapper}>
                <Search size={14} className={styles.searchIcon} />
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder="Buscar por nombre, SKU..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Buscar productos"
                />
                {search && (
                    <span className={styles.productCount}>{filtered.length}</span>
                )}
            </div>

            {loading ? (
                <div className={styles.listContainer}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <div className={styles.skeletonImage} />
                            <div className={styles.skeletonContent}>
                                <div className={styles.skeletonLine} />
                                <div className={styles.skeletonLine} style={{ width: '60%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyContainer}>
                    <PackageSearch size={40} color="var(--color-text-tertiary)" />
                    <p className={styles.emptyText}>
                        {search ? 'Sin resultados para tu búsqueda' : 'No hay productos disponibles'}
                    </p>
                </div>
            ) : (
                <div
                    className={styles.listContainer}
                    role="listbox"
                    aria-label="Lista de productos del proveedor"
                >
                    {filtered.map((product, index) => (
                        <div
                            key={product.id}
                            className={`${styles.productRow} ${selectedProductId === product.id ? styles.selected : ''}`}
                            role="option"
                            tabIndex={0}
                            aria-selected={selectedProductId === product.id}
                            aria-label={`Seleccionar ${product.name}`}
                            onClick={() => onSelectProduct(product.id)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelectProduct(product.id);
                                }
                            }}
                        >
                            <img
                                src={normalizeImageUrl(product.images?.[0]) ?? DEFAULT_IMAGE_PLACEHOLDER}
                                alt={product.name}
                                className={styles.thumbnail}
                                loading="lazy"
                                onError={e => { e.currentTarget.src = DEFAULT_IMAGE_PLACEHOLDER; }}
                            />
                            <div className={styles.info}>
                                <span className={styles.productName}>{product.name}</span>
                                <span className={styles.productMeta}>
                                    {product.sku && <span className={styles.sku}>{product.sku}</span>}
                                    {product.category && (
                                        <span className={styles.category}>{product.category.name}</span>
                                    )}
                                </span>
                            </div>
                            <div className={styles.right}>
                                <span className={styles.price}>{currencyFormatter.format(product.price)}</span>
                                <span className={`${styles.stockBadge} ${product.inStock ? styles.inStock : styles.outOfStock}`}>
                                    {product.inStock ? `Stock: ${product.stock}` : 'Sin stock'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </aside>
    );
}
