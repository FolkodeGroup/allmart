import React, { useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { Edit2, Check, X } from 'lucide-react';
import styles from '../AdminVariants.module.css';
import { useUnsavedChanges } from '../../../../context/useUnsavedChanges';

type VariantValue = string | { id?: string; label?: string; [key: string]: unknown };

const getVariantValueLabel = (value: VariantValue): string => {
  if (typeof value === 'string') return value;
  if (typeof value.label === 'string') return value.label;
  if (typeof value.id === 'string') return value.id;
  return String(value);
};

interface VariantValueChipProps {
  value: VariantValue;
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
  const [editValue, setEditValue] = useState(getVariantValueLabel(value));
  const [editError, setEditError] = useState('');
  const { setIsDirty } = useUnsavedChanges();

  const enterEditMode = () => {
    if (!canEdit) return;
    setIsEditing(true);
    setEditValue(getVariantValueLabel(value));
    setEditError('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue(getVariantValueLabel(value));
    setEditError('');
  };

  const commitEdit = () => {
    const newValue = editValue.trim();
    if (!newValue) {
      setEditError('El valor no puede estar vacío');
      return;
    }
    const originalValue = getVariantValueLabel(value);
    if (newValue === originalValue) {
      cancelEdit();
      return;
    }
    // Validar que no exista el mismo valor (se valida en servidor)
    onEdit(originalValue, newValue);
    setIsDirty(true);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  if (isEditing) {
    return (
      <div className={`${styles.valueChipEdit} fadeIn scaleIn`}>
        <input
          type="text"
          className={`${styles.valueChipInput} ${editError ? styles.inputError : ''}`}
          value={editValue}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onChange={e => {
            setEditValue(e.target.value);
            if (e.target.value !== getVariantValueLabel(value)) {
              setIsDirty(true);
            }
            if (editError) setEditError('');
          }}
          onKeyDown={handleKeyDown}
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
    <span className={`${styles.valueChip} fadeIn microHover`} style={{ willChange: 'opacity, transform' }}>
      {getVariantValueLabel(value)}
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