

import React, { memo } from 'react';
import { ProductCardCheckbox } from '../../../components/ui/ProductCardCheckbox';
import { ProductCardImage } from '../../../components/ui/ProductCardImage';
import { ProductCardInfo } from '../../../components/ui/ProductCardInfo';
import { ProductCardPrice } from '../../../components/ui/ProductCardPrice';
import { ProductCardMeta } from '../../../components/ui/ProductCardMeta';
import { ProductCardActions } from '../../../components/ui/ProductCardActions';
import styles from './AdminProductCard.module.css';
import { Badge } from '../../../components/ui/Badge/Badge';
import { LOW_STOCK_THRESHOLD } from '../../../constants/inventory';
import { isLowStock } from '../../../utils/inventory';
import { AlertTriangle } from 'lucide-react';

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

export const AdminProductCard: React.FC<AdminProductCardProps> = memo(({
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

  return (
    <section
      className={styles.card}
      aria-label={`Producto: ${name}${category ? ', categoría ' + category : ''}`}
    >
      {showCheckbox && onSelectChange && (
        <ProductCardCheckbox
          checked={selected}
          onChange={checked => onSelectChange(id, checked)}
          label={`Seleccionar producto ${name}`}
        />
      )}
      <ProductCardImage
        src={image}
        alt={`Imagen de ${name}${category ? ', categoría ' + category : ''}`}
      />
      {typeof stock === 'number' && isLowStock(stock, LOW_STOCK_THRESHOLD) && (
        <div style={{ position: 'absolute', top: 12, left: 45, zIndex: 2, alignItems: "flex-start", margin: 4 }}>
          <Badge className={styles.lowStockBadge}>
            <AlertTriangle size={16} style={{marginRight: 4}} /> Stock bajo
          </Badge>
        </div>
      )}
      <div className={styles.info}>
        <ProductCardInfo name={name} sku={sku} category={category} />
        <ProductCardPrice price={price} discount={discount} />
        <ProductCardMeta stock={stock} inStock={inStock} />
      </div>
      <ProductCardActions
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={onEdit ? () => onEdit(id) : undefined}
        onDelete={onDelete ? () => onDelete(id) : undefined}
        name={name}
      />
    </section>
  );
});

AdminProductCard.displayName = 'AdminProductCard';

