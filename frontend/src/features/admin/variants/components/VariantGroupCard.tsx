import React, { useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { AlertTriangle } from 'lucide-react';
import { VariantValueChip } from './VariantValueChip';
import styles from '../AdminVariants.module.css';

interface VariantGroup {
  id: string;
  name: string;
  values: string[];
}

interface VariantGroupCardProps {
  group: VariantGroup;
  onEditName: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onAddValue: (groupId: string, value: string) => void;
  onRemoveValue: (groupId: string, value: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  newValue: string;
  setNewValue: (value: string) => void;
  error: string;
}

/**
 * VariantGroupCard - Tarjeta que representa un grupo de variantes.
 *
 * Responsabilidades:
 * - Mostrar nombre del grupo (editable inline).
 * - Lista de valores como chips.
 * - Input para agregar nuevos valores.
 * - Botones para editar/eliminar grupo.
 */
export const VariantGroupCard: React.FC<VariantGroupCardProps> = ({
  group,
  onEditName,
  onDelete,
  onAddValue,
  onRemoveValue,
  canEdit,
  canDelete,
  newValue,
  setNewValue,
  error,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editError, setEditError] = useState('');

  const startEdit = () => {
    if (!canEdit) return;
    setIsEditing(true);
    setEditName(group.name);
    setEditError('');
  };

  const commitEdit = () => {
    const name = editName.trim();
    if (!name) {
      setEditError('El nombre no puede estar vacío');
      return;
    }
    onEditName(group.id, name);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName(group.name);
    setEditError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleAddValue = () => {
    if (newValue.trim()) {
      onAddValue(group.id, newValue.trim());
      setNewValue('');
    }
  };

  const handleValueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddValue();
  };

  return (
    <div className={styles.groupCard}>
      {/* Header del grupo */}
      <div className={styles.groupHeader}>
        {isEditing ? (
          <div className={styles.editGroupNameWrapper}>
            <input
              className={`${styles.groupNameEdit} ${editError ? styles.inputError : ''}`}
              value={editName}
              autoFocus
              onChange={e => {
                setEditName(e.target.value);
                if (editError) setEditError('');
              }}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
            />
            {editError && <div className={styles.errorText}>{editError}</div>}
          </div>
        ) : (
          <Tooltip title={canEdit ? 'Hacer clic para editar el nombre del grupo de variantes' : 'No tienes permisos para editar'} placement="top" arrow>
            <button
              className={styles.groupName}
              onClick={startEdit}
              type="button"
              style={canEdit ? undefined : { cursor: 'default' }}
            >
              {group.values.length === 0 && (
                <Tooltip title="Esta variante no tiene valores definidos. Agrega valores para completarla." placement="top" arrow>
                  <span className={styles.incompleteIndicator}>
                    <AlertTriangle size={16} />
                  </span>
                </Tooltip>
              )}
              {group.name}
              {canEdit && <span className={styles.editHint}>✏️</span>}
            </button>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip title="Eliminar este grupo de variantes y todos sus valores asociados" placement="top" arrow>
            <button
              className={styles.deleteGroupBtn}
              onClick={() => onDelete(group.id)}
              type="button"
            >
              🗑️
            </button>
          </Tooltip>
        )}
      </div>

      {/* Valores / chips */}
      <div className={styles.valuesContainer}>
        {group.values.length === 0 && (
          <span className={styles.noValues}>Sin valores aún</span>
        )}
        {group.values.map(val => (
          <VariantValueChip
            key={val}
            value={val}
            onRemove={() => onRemoveValue(group.id, val)}
            canDelete={canDelete}
          />
        ))}
      </div>

      {/* Input para agregar valor */}
      {canEdit && (
        <div className={styles.addValueSection}>
          <div className={styles.addValueRow}>
            <input
              className={`${styles.valueInput} ${error ? styles.inputError : ''}`}
              type="text"
              placeholder={`Agregar valor a ${group.name}...`}
              value={newValue}
              onChange={e => {
                setNewValue(e.target.value);
                // Limpiar error
              }}
              onKeyDown={handleValueKeyDown}
            />
            <Tooltip title={`Agregar un nuevo valor al grupo "${group.name}"`} placement="top" arrow>
              <button
                className={styles.addValueBtn}
                type="button"
                onClick={handleAddValue}
              >
                ＋
              </button>
            </Tooltip>
          </div>
          {error && <span className={styles.errorText}>{error}</span>}
        </div>
      )}
    </div>
  );
};