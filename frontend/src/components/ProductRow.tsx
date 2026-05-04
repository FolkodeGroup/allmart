// features/admin/collections/ProductRow.tsx

import React from 'react';
import { DEFAULT_IMAGE_PLACEHOLDER, normalizeImageUrl } from '../utils/imageUrl';
import styles from './ProductRow.module.css';

export interface ProductRowData {
    id: string;
    name: string;
    sku?: string;
    price?: number;
    imageUrl?: string;
}

interface ProductRowProps {
    product: ProductRowData;
    onRemove?: (id: string) => void;
    removeLabel?: string;
}

export const ProductRow: React.FC<ProductRowProps> = ({
    product,
    onRemove,
    removeLabel = 'Eliminar',
}) => (
    <div className={styles.productRow}>
        <img
            src={normalizeImageUrl(product.imageUrl) ?? DEFAULT_IMAGE_PLACEHOLDER}
            alt={product.name}
            className={styles.productRowImage}
            loading="lazy"
            onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE_PLACEHOLDER; }}
        />
        <div className={styles.productRowInfo}>
            <span className={styles.productRowName}>{product.name}</span>
            {product.id && (
                <span className={styles.productRowId}>ID: {product.id}</span>
            )}
            {product.price !== undefined && (
                <span className={styles.productRowPrice}>${product.price.toFixed(2)}</span>
            )}
            {product.sku && (
                <span className={styles.productRowSku}>{product.sku}</span>
            )}
        </div>
        {onRemove && (
            <button
                type="button"
                className={styles.productRowRemove}
                onClick={() => onRemove(product.id)}
                aria-label={`${removeLabel} ${product.name}`}
            >
                {removeLabel}
            </button>
        )}
    </div>
);