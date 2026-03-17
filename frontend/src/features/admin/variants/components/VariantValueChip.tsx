import React, { useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { Edit2, Check, X } from 'lucide-react';
import styles from '../AdminVariants.module.css';

interface VariantValueChipProps {
  value: string;
  onRemove: () => void;
  onEdit: (oldValue: string, newValue: string) => void;
  canDelete: boolean;
  canEdit: boolean;
}

/**
 * VariantValueChip - Chip que representa un valor de variante.
 * Permite edición inline, eliminación y validación instantánea.
 *
 * Responsabilidades:
 * - Mostrar el valor como chip (editable).
 * - Botón para eliminar el valor.
 * - Botón para editar (modo inline).
 * - Validación instantánea de cambios.
 */
export const VariantValueChip: React.FC<VariantValueChipProps> = ({
  value,
  onRemove,
  onEdit,
  canDelete,
  canEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [editError, setEditError] = useState('');

  const enterEditMode = () => {
    if (!canEdit) return;
    setIsEditing(true);
    setEditValue(value);
    setEditError('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue(value);
    setEditError('');
  };

  const commitEdit = () => {
    const newValue = editValue.trim();
    if (!newValue) {
      setEditError('El valor no puede estar vacío');
      return;
    }
    if (newValue === value) {
      cancelEdit();
      return;
    }
    // Validar que no exista el mismo valor (se valida en servidor)
    onEdit(value, newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  if (isEditing) {
    return (
      <div className={styles.valueChipEdit}>
        <input
          type="text"
          className={`${styles.valueChipInput} ${editError ? styles.inputError : ''}`}
          value={editValue}
          autoFocus
          onChange={e => {
            setEditValue(e.target.value);
            if (editError) setEditError('');
          }}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          placeholder="Valor..."
        />
        {editError && <span className={styles.chipErrorText}>{editError}</span>}
        <div className={styles.chipEditActions}>
          <Tooltip title="Guardar cambios" placement="top" arrow>
            <button
              type="button"
              className={styles.chipConfirmBtn}
              onClick={commitEdit}
            >
              <Check size={14} />
            </button>
          </Tooltip>
          <Tooltip title="Cancelar edición" placement="top" arrow>
            <button
              type="button"
              className={styles.chipCancelBtn}
              onClick={cancelEdit}
            >
              <X size={14} />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <span className={styles.valueChip}>
      {value}
      <div className={styles.chipActions}>
        {canEdit && (
          <Tooltip title={`Editar el valor "${value}"`} placement="top" arrow>
            <button
              type="button"
              className={styles.chipEditBtn}
              onClick={enterEditMode}
            >
              <Edit2 size={12} />
            </button>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip title={`Eliminar el valor "${value}"`} placement="top" arrow>
            <button
              type="button"
              className={styles.chipRemove}
              onClick={onRemove}
            >
              ×
            </button>
          </Tooltip>
        )}
      </div>
    </span>
  );
};