import React from 'react';
import { ProductImage } from '../../../components/ui/ProductImage';
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
  selected?: boolean;
  onSelectChange?: (id: string, checked: boolean) => void;
  showCheckbox?: boolean;
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
  selected = false,
  onSelectChange,
  showCheckbox = false,
}) => {
  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  return (
    <section
      className={styles.card}
      role="region"
      aria-label={`Producto: ${name}${category ? ', categoría ' + category : ''}`}
      tabIndex={0}
    >
      {showCheckbox && (
        <div className={styles.checkboxWrapper}>
          <label>
            <input
              type="checkbox"
              checked={selected}
              onChange={e => onSelectChange && onSelectChange(id, e.target.checked)}
              aria-checked={selected}
              aria-label={`Seleccionar producto ${name}`}
              tabIndex={0}
            />
            <span className="sr-only">Seleccionar producto {name}</span>
          </label>
        </div>
      )}
      <div className={styles.imageWrapper}>
        {image ? (
          <ProductImage
            src={image}
            alt={`Imagen de ${name}${category ? ', categoría ' + category : ''}`}
            className={styles.image}
            width={240}
            height={180}
            placeholder={
              // SVG blur placeholder o color
              'data:image/svg+xml,%3Csvg width="240" height="180" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="240" height="180" fill="%23f3f3f3"/%3E%3C/svg%3E'
            }
          />
        ) : (
          <div
            className={styles.noImage}
            role="img"
            aria-label={`Sin imagen de ${name}`}
            tabIndex={0}
          >Sin imagen</div>
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
          <button
            className={styles.editBtn}
            onClick={() => onEdit && onEdit(id)}
            title={`Editar ${name}`}
            aria-label={`Editar producto ${name}`}
            tabIndex={0}
          >
            <span aria-hidden="true">✏️</span>
          </button>
        )}
        {canDelete && (
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete && onDelete(id)}
            title={`Eliminar ${name}`}
            aria-label={`Eliminar producto ${name}`}
            tabIndex={0}
          >
            <span aria-hidden="true">🗑️</span>
          </button>
        )}
        {!canEdit && !canDelete && (
          <span className={styles.readOnly}>Solo lectura</span>
        )}
      </div>
    </section>
  );
};

