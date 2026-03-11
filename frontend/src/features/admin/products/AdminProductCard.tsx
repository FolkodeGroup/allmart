import React from 'react';
import styles from './AdminProductCard.module.css';

interface AdminProductCardProps {
  id: string;
  name: string;
  sku?: string;
  price: number;
  discount?: number;
  stock: number;
  inStock: boolean;
  image?: string;
  category: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const AdminProductCard: React.FC<AdminProductCardProps> = ({
  id,
  name,
  sku,
  price,
  discount,
  stock,
  inStock,
  image,
  category,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {image ? (
          <img
            src={image}
            alt={name}
            className={styles.image}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className={styles.noImage}>Sin imagen</div>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.headerRow}>
          <span className={styles.name}>{name}</span>
          {sku && <span className={styles.sku}>SKU: {sku}</span>}
        </div>
        <div className={styles.category}>{category}</div>
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(price)}</span>
          {discount && discount > 0 && (
            <span className={styles.discount}>-{discount}%</span>
          )}
        </div>
        <div className={styles.metaRow}>
          <span className={stock > 0 ? styles.stockOk : styles.stockOut}>
            Stock: {stock}
          </span>
          <span className={inStock ? styles.statusActive : styles.statusInactive}>
            {inStock ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        {canEdit && (
          <button className={styles.editBtn} onClick={() => onEdit && onEdit(id)} title="Editar">
            ✏️
          </button>
        )}
        {canDelete && (
          <button className={styles.deleteBtn} onClick={() => onDelete && onDelete(id)} title="Eliminar">
            🗑️
          </button>
        )}
        {!canEdit && !canDelete && (
          <span className={styles.readOnly}>Solo lectura</span>
        )}
      </div>
    </div>
  );
};
