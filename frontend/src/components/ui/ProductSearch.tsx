// components/ProductSearch.tsx
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { Product } from '../../types';
import stylesSearch from './ProductSearch.module.css';
import { X } from 'lucide-react';
import { DEFAULT_IMAGE_PLACEHOLDER } from '../../utils/imageUrl';

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
        <div className={stylesSearch.searchWrapper}>
            <input
                type="search"
                className={stylesSearch.searchInput}
                placeholder="¿Qué producto estás buscando?"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmit();
                }}
                onFocus={() => results.length > 0 && onChange(query)}
                style={{ color: '#111827' }}
            />
            {query.length > 0 && (
                <button
                    className={stylesSearch.clearButton}
                    onClick={() => onChange('')}
                    title="Limpiar búsqueda"
                    type="button"
                >
                    <X size={16} />
                </button>
            )}

            <button type="button" onClick={onSubmit} className={stylesSearch.searchButton} aria-label="Buscar">
               <Search size={18} className={stylesSearch.searchIcon} />
            </button>

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
                                {/* 🟢 FIX: Si el array images está vacío, mostrar placeholder en lugar de romper el icono */}
                                <img 
                                    src={product.images?.[0] || DEFAULT_IMAGE_PLACEHOLDER} 
                                    alt={product.name} 
                                    onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE_PLACEHOLDER; }}
                                />
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