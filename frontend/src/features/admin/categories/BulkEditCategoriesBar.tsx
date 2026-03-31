import React from 'react';
import styles from './BulkEditCategoriesBar.module.css';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

export interface BulkEditCategoriesBarProps {
  selectedCount: number;
  onToggleVisibility: (makeVisible: boolean) => void;
  onDelete: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const BulkEditCategoriesBar: React.FC<BulkEditCategoriesBarProps> = ({
  selectedCount,
  onToggleVisibility,
  onDelete,
  onCancel,
  loading = false,
}) => {
  return (
    <div className={styles.bulkEditBar} role="toolbar" aria-label="Acciones masivas">
      <span className={styles.label}>{selectedCount} seleccionada{selectedCount !== 1 ? 's' : ''}</span>
      
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.visibilityBtn}
          onClick={() => onToggleVisibility(true)}
          disabled={loading}
          title="Mostrar en tienda"
          aria-label="Mostrar categorías seleccionadas en tienda"
        >
          <Eye size={18} />
          Mostrar
        </button>
        
        <button
          type="button"
          className={styles.visibilityBtn}
          onClick={() => onToggleVisibility(false)}
          disabled={loading}
          title="Ocultar en tienda"
          aria-label="Ocultar categorías seleccionadas de tienda"
        >
          <EyeOff size={18} />
          Ocultar
        </button>

        <button
          type="button"
          className={styles.deleteBtn}
          onClick={onDelete}
          disabled={loading}
          title="Eliminar categorías"
          aria-label="Eliminar categorías seleccionadas"
        >
          <Trash2 size={18} />
          Eliminar
        </button>

        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={loading}
          aria-label="Cancelar selección"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
