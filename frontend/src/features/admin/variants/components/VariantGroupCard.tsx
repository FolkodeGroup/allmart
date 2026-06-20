import React, { useState, useRef, useEffect } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { AlertTriangle, MoreVertical } from 'lucide-react';
import { VariantValueChip } from './VariantValueChip';
import styles from '../AdminVariants.module.css';

import type { VariantGroup } from '../../../../context/AdminVariantsContext';

type VariantValue = string | { id?: string; label?: string;[key: string]: unknown };

const getVariantValueKey = (value: VariantValue): string => {
  if (typeof value === 'string') return value;
  if (typeof value.id === 'string' && value.id.trim()) return value.id;
  if (typeof value.label === 'string' && value.label.trim()) return value.label;
  return JSON.stringify(value);
};

const getVariantValueLabel = (value: VariantValue): string => {
  if (typeof value === 'string') return value;
  if (typeof value.label === 'string') return value.label;
  if (typeof value.id === 'string') return value.id;
  return String(value);
};

interface VariantGroupCardProps {
  group: VariantGroup;
  onEditName: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (group: VariantGroup) => void;
  onEditValue: (groupId: string, oldValue: string, newValue: string) => void;
  onToggleStatus: (id: string, newStatus: boolean) => void;
  onAddValue: (groupId: string, value: string) => void;
  onRemoveValue: (groupId: string, value: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  newValue: string;
  setNewValue: (value: string) => void;
  error: string;
  isPendingNavigation: boolean;
  setIsDirty?: (value: boolean) => void;
  onOpenEditModal: (groupId: string) => void;
}

/**
 * VariantGroupCard - Tarjeta que representa un grupo de variantes.
 */
export const VariantGroupCard: React.FC<VariantGroupCardProps> = ({
  group,
  onEditName,
  onDelete,
  onEditValue,
  onToggleStatus,
  onAddValue,
  onRemoveValue,
  canEdit,
  canDelete,
  newValue,
  setNewValue,
  error,
  setIsDirty,
  onOpenEditModal, // Agregado para resolver error TS2304
  onDuplicate      // Agregado para resolver error TS2304
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [editError, setEditError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Cerrar menú con Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen]);

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
    setIsDirty?.(false);
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

  // Helper: ejecutar acción del menú y cerrarlo
  const menuAction = (fn: () => void) => {
    fn();
    setMenuOpen(false);
  };

  return (
    <div className={`${styles.groupCard} fadeIn slideUpIn microHover`} style={{ willChange: 'opacity, transform' }}>
      {/* Header del grupo */}
      <div className={styles.groupHeader}>
        {isEditing ? (
          <div className={styles.editGroupNameWrapper}>
            <input
              className={`${styles.groupNameEdit} ${editError ? styles.inputError : ''}`}
              value={editName}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onChange={e => {
                setEditName(e.target.value);
                setIsDirty?.(true);
                if (editError) setEditError('');
              }}
              onKeyDown={handleKeyDown}
            />
            {editError && <div className={styles.errorText}>{editError}</div>}
          </div>
        ) : (
          <Tooltip
            title={canEdit ? 'Clic para editar el nombre' : 'Sin permisos de edición'}
            placement="top"
            arrow
          >
            <button
              className={styles.groupName}
              onClick={startEdit}
              type="button"
              style={canEdit ? undefined : { cursor: 'default' }}
            >
              {group.values.length === 0 && (
                <Tooltip
                  title="Sin valores definidos. Agregá valores para completar esta variante."
                  placement="top"
                  arrow
                >
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

        {/* Menú de tres puntos */}
        <div className={styles.groupActionsMenu} ref={menuRef}>
          <Tooltip title="Más acciones" placement="top" arrow>
            <button
              className={`${styles.menuTriggerBtn} ${menuOpen ? styles.menuTriggerActive : ''}`}
              type="button"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <MoreVertical size={20} />
            </button>
          </Tooltip>

          {menuOpen && (
            <div className={styles.actionsDropdown} role="menu">
              {/* Toggle estado */}
              <button
                className={styles.dropdownItem}
                type="button"
                role="menuitem"
                onClick={() => menuAction(() => onToggleStatus(group.id, !group.isActive))}
              >
                <span className={group.isActive ? styles.dotActive : styles.dotInactive} />
                {group.isActive ? 'Desactivar variante' : 'Activar variante'}
              </button>

              {/* Editar avanzado */}
              <button
                className={styles.dropdownItem}
                type="button"
                role="menuitem"
                onClick={() => menuAction(() => onOpenEditModal(group.id))}
              >
                🛠️ Editar (avanzado)
              </button>

              {/* Duplicar */}
              <button
                className={styles.dropdownItem}
                type="button"
                role="menuitem"
                onClick={() => menuAction(() => onDuplicate(group))}
              >
                ⧉ Duplicar grupo
              </button>

              {/* Separador antes de eliminar */}
              {canDelete && <div className={styles.dropdownDivider} />}

              {/* Eliminar */}
              {canDelete && (
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  type="button"
                  role="menuitem"
                  onClick={() => menuAction(() => onDelete(group.id))}
                >
                  🗑️ Eliminar grupo
                </button>
              )}
            </div>
          )}
        </div>
      </div>



      {/* Input para agregar valor */}
      {canEdit && (
        <div className={styles.addValueSection}>
          <div className={`${styles.addValueRow} ${error ? styles.addValueRowError : ''}`}>
            <input
              className={styles.valueInput}
              type="text"
              placeholder={`Agregar valor a ${group.name}...`}
              value={newValue}
              onChange={e => {
                setNewValue(e.target.value);
                setIsDirty?.(true);
              }}
              onKeyDown={handleValueKeyDown}
            />
            <div className={styles.addValueDivider} />
            <Tooltip title={`Agregar valor al grupo "${group.name}"`} placement="top" arrow>
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
      {/* Valores / chips */}
      <div className={styles.valuesContainer}>
        {group.values.length === 0 && (
          <span className={styles.noValues}>Sin valores aún</span>
        )}
        {group.values.map((val: VariantValue) => (
          <VariantValueChip
            key={getVariantValueKey(val)}
            value={val}
            onRemove={() => onRemoveValue(group.id, getVariantValueLabel(val))}
            onEdit={(oldVal, newVal) => onEditValue(group.id, oldVal, newVal)}
            canDelete={canDelete}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
};