import React from 'react';
import { Tooltip } from './Tooltip';
import styles from '../../features/admin/products/AdminProductCard.module.css';

interface ProductCardActionsProps {
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  name: string;
}

export const ProductCardActions: React.FC<ProductCardActionsProps> = ({ canEdit, canDelete, onEdit, onDelete, name }) => (
  <div className={styles.actions}>
    {canEdit && (
      <Tooltip content="Editar producto">
        <button
          className={styles.editBtn}
          onClick={onEdit}
          aria-label={`Editar producto ${name}`}
          tabIndex={0}
          type="button"
        >
          <span aria-hidden="true">✏️</span>
        </button>
      </Tooltip>
    )}
    {canDelete && (
      <Tooltip content="Eliminar producto">
        <button
          className={styles.deleteBtn}
          onClick={onDelete}
          aria-label={`Eliminar producto ${name}`}
          tabIndex={0}
          type="button"
        >
          <span aria-hidden="true">🗑️</span>
        </button>
      </Tooltip>
    )}
    {!canEdit && !canDelete && (
      <span className={styles.readOnly}>Solo lectura</span>
    )}
  </div>
);
