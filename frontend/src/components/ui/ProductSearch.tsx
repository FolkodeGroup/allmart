// components/ProductSearch.tsx
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { Product } from '../../types';
import styles from '../layout/Header/Header.module.css';
import stylesSearch from './ProductSearch.module.css';
import { X } from 'lucide-react';

interface ProductSearchProps {
    query: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    results: Product[];
    showDropdown: boolean;
    onCloseDropdown: () => void;
}

export function ProductSearch({
    query,
    onChange,
    onSubmit,
    results,
    showDropdown,
    onCloseDropdown,
}: ProductSearchProps) {

    return (
        <div
            className={styles.searchWrapper}>
            <input
                type="search"
                className={styles.searchInput}
                placeholder="¿Qué producto estás buscando?"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmit();
                }}
                onFocus={() => results.length > 0 && onChange(query)}
            />
            {query.length > 0 && (
                <button
                    className={stylesSearch.clearButton}
                    onClick={() => onChange('')}
                    title="Limpiar búsqueda"
                >
                    <X size={16} />
                </button>
            )}

            <Search
                size={18}
                className={styles.searchIcon}
                onClick={onSubmit}
            />

            {showDropdown && (
                <div className={stylesSearch.dropdown}>
                    {results.length > 0 ? (
                        results.map((product) => (
                            <Link
                                key={product.id}
                                to={`/producto/${product.slug}`}
                                className={stylesSearch.item}
                                onClick={onCloseDropdown}
                            >
                                <img src={product.images[0]} alt={product.name} />
                                <div>
                                    <p>{product.name}</p>
                                    <span>{product.category?.name}</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className={stylesSearch.noResults}>
                            No se encontraron productos
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}